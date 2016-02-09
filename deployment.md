# Deployment Guide

## Get a Machine

Register for AWS (get free credit here: bit.ly/aws-mlh)
	I used web2016@emmajuneevent.com

Sign in to AWS console

Find a link to the EC2 Dashboard

Make sure you're in the appropriate geographical zone (my default put me in Oregon by mistake so high latency!) This is currently displayed at the top right of the page, between "Christopher Little" and "Support".

Create a new EC2 Instance

Select Ubuntu Server

Select an appropriate instance_ type (probably t2.micro to begin with because it's free and generalised). Mostly after that the default settings are sufficient - the only change is the security group. By default it will only allow SSH traffic from the outside world. We want to make sure HTTP traffic (port 80) is allowed too. Create a new rule under "Configure Security Group" to allow all HTTP traffic. Add another new rule allowing traffic on ports 3000-4000 (to give us some space to work). Make sure you allow IPs from "Anywhere". Feel free to allow more in other places too if you like.

When you first launch, you will be asked to create a new key pair. Do this. It will allow you to SSH into the machine. Download the .pem file and keep it somewhere.

Amazon doesn't automatically grant a public IP address to EC2 machines. In Amazon parlance they're known as "Elastic IPs". On the left hand menu, click on Elastic IPs and then the "Allocate New Address" button. I _think_ these are free... Right click on the new address once it's been allocated, and click on "Associate". Your new instance should be suggested when you start filling in the form. Make a note of this address!

You can now SSH in from the terminal using your key:

    chmod 600 yourkeyname.pem; # This is required for ssh accept to use the key
    ssh -i yourkeyname.pem ubuntu@your-elastic-IP

## Install All The Things

We are going to need: git, nginx, mysql, ruby (for sass), node/npm. I like to install a more up-to-date version of node than is available in the standard repos.

    curl -sL https://deb.nodesource.com/setup | sudo bash -
    # NB the script above calls sudo apt-get update
    sudo apt-get install -y git nginx mysql-server ruby build-essential nodejs
    # Note down the password for mysql!
    sudo gem install sass

At this point you should be able to browse to your Elastic IP in the browser and see nginx's "Hello world!" page.

It also never hurts to update the pre-installed packages

    sudo apt-get upgrade

Feel free to take some time to set up new users and make yourself feel at home. In particular, let's setup a MySQL user for mabel to use.

    mysql -u root -p
    <Your password here>
    mysql> CREATE USER 'mabel'@'localhost' IDENTIFIED BY 'PASSWORD';
    mysql> GRANT ALL PRIVILEGES ON *.* TO 'mabel'@'localhost';
    mysql> FLUSH PRIVILEGES;

It might be safer to grant fewer privileges but life's too short. You may also like to create the user for any source, rather than just localhost. Do this with `'mabel'@'*'`. This will allow you to log in from home rather than SSHing in and then logging in, but then opens you up to remote attackers. But life _is_ pretty short...

## Get Mabel

Download the code from github, and install dependencies. Cross your fingers that everything builds correctly. Before we do that, though, we'll create a new user to run mabel.

    sudo adduser mabel;
    # ...
    sudo su mabel;
    cd;
    git clone http://github.com/mabelticketing/mabel;
    cd mabel;
    npm run prepare;

The `prepare` script will ask you for a mysql username and password, and a database to use (it will create the DB if it doesn't already exist), and installs the schema, views and default data.

(FYI if you have a angular version conflict, use whatever lines up with Angular Resource or Angular-Routes or Angular-Cookies).

You will need to configure Mabel's `config.js` to tell it which database details to use.

Give it a spin with `node app.js`. You should be able to tack ':3008' to the elastic IP in your browser and see Mabel running! 

Technically, you could just call this a job done because everything should be workable. I want to do a few more things though...

## upstart Configuration

We want Mabel to pick herself up off her feet if she crashes, and also to start herself up if the server itself crashes. Enter _upstart_.

Create a new file in `/etc/init/mabel.conf` (probably will need sudo). Enter the following:

    description "Start Mabel"
    author "Christopher Little"
     
    start on (local-filesystems and net-device-up) # Mabel starts when the computer turns on..
    stop on shutdown                               # .. and doesn't stop until it switches off
     
    instance "Mabel - Node"
     
    pre-start script
        # Any set-up you want to do here (e.g. create dirs for logs etc).
        # I'm being lazy and whacking everything in the home directory
        # So nothing here for me!
    end script
     
    respawn             # This line tells Mabel to pick herself up if she crashes
    respawn limit 5 60  # but give up if she crashes more than 5 times in 60 secs
     
    script
        # upstart scripts run as root which is bad, so I'm executing this command as mabel.
        cd /home/mabel/mabel;
        exec sudo -u mabel bash -c "node app.js >> ../mabel_log.txt 2>&1"
    end script

You should now be able to run Mabel with `sudo service mabel start`. Other operations instead of `start` include `stop` and `restart`. You can check the status of things with 
    
    initctl list | grep mabel;

As long as that says something like "start/running" then you should be able to go back online and see Mabel shine. You can even see the running process with `ps aux | grep node`, kill it with `sudo kill <process_id>` and see Mabel bounce right back up again with a different process id.

## DNS Configuration

Let's use our own domain name rather than the lovely URL Amazon has given us. Log into your domain provider (or DNS provider if they're separate). Find the DNS configuration, and point something at your Elastic IP. At the very least set up a subdomain - "tickets.emmajuneevent.com" or something. Maybe also "staging"? Up to you. 

DNS changes take a while to propagate, so feel free to add entries to /etc/hosts/ to get your local machine working in the meantime. Simply add these lines:

    <elastic IP> tickets.emmajuneevent.com
    <elastic IP> staging.emmajuneevent.com

You should now be able to browse to http://tickets.emmajuneevent.com:3008/ and see Mabel. We're getting close!

## NGinx Configuration

Let's run things through port 80 rather than 3008. Maybe even alongside our static web server. Also there's no point in introducing the node/express overhead for the Mabel client (i.e. everything but the API endpoints), so let's get nginx to serve them directly. In future, we might like to do this with Amazon S3 for extra performance (it's literally designed for fast static resources) but for now I think this is sufficient.

nginx keeps its site configuration in `/etc/nginx/sites-available`. There's probably some default site in there, but we'll ignore that and create a new one at `etc/nginx/sites-available/mabel`. Enter the following:

    server {
            listen 80;
            server_name tickets.emmajuneevent.com; # you can enter other domains here, space-separated

            # Any requests made to the root address '/' will get forwarded to port 3008.
            location / {
                    proxy_pass http://localhost:3008;
                    proxy_http_version 1.1;

                    proxy_set_header Upgrade $http_upgrade;
                    proxy_set_header Connection 'upgrade';
                    proxy_set_header Host $host;
                    proxy_cache_bypass $http_upgrade;
            }
    }


Obviously you can create other files for other sites - the `listen` and `server_name` directives make nginx choose the right response for each request. For example, I'm making a second identical file with `server_name staging.emmajuneevent.com` and saving it as `eje16-staging`. I've also changed the port number to 3007, and I'll repeat the steps above to ensure a second, separate installation of mabel runs on port 3007 (with its own separate database). 

You can enable a site by linking the file to `/etc/nginx/sites-enabled`:

    sudo ln -s /etc/nginx/sites-available/mabel /etc/nginx/sites-enabled/mabel
    sudo ln -s /etc/nginx/sites-available/eje16-staging /etc/nginx/sites-enabled/eje16-staging

Restart nginx and we should be good!

    sudo service nginx restart;

Browse to http://tickets.emmajuneevent.com and Mabel should show up again. You may have to refresh, or force-empty the cache (Ctrl+F5).

This is also where we could set up extra redundant instances of Mabel and load balance between them (but I don't think I'm gonna bother doing that this year).

## Secure Your Staging Server

It probably doesn't matter much if commoners find their way onto your staging server, since you won't be printing tickets from there. But it can be nice to have a secure site where you can upload themed content before launch. It's very easy to add basic authentication to an nginx site.

First we need to create a file describing what the username and password should be for the site. The easiest way to do that is with a tool called `htpasswd`:

    sudo apt-get install -y apache2-utils
    sudo htpasswd -c /etc/nginx/.htpasswd <Username You Want To Log In With>
    # ... enter the password you want to log in with

Now update your nginx configuration to use this username and password:
    
    server {
        listen 80;
        server_name staging.emmajuneevent.com;
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;
        ...

Restart nginx as before (`sudo service nginx restart`) and now when you browse to http://staging.emmajuneevent.com your browser should present you with a login dialog. Success!
