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

You can look around the EC2 dashboard if you like, but mostly you're done with setting up the machine now. Grab the public DNS address. Mine looks like ` ec2-52-30-220-107.eu-west-1.compute.amazonaws.com`.

SSH in from the terminal using the new key:

    chmod 600 yourkeyname.pem; # This is required for ssh accept to use the key
    ssh -i yourkeyname.pem ubuntu@your-public-dns-here.com

## Install All The Things

We are going to need: git, nginx, mysql, ruby (for sass), node/npm

    sudo apt-get update
    sudo apt-get install -y git nginx mysql-server ruby
    # Note down the password for mysql!
    sudo gem install sass

At this point you should be able to browse to your public DNS in the browser and see nginx's "Hello world!" page.

I like to install a more up-to-date version of node than is available in the standard repos.

    curl -sL https://deb.nodesource.com/setup | sudo bash -
    sudo apt-get install -y build-essential nodejs

It also never hurts to update the pre-installed packages

    sudo apt-get upgrade

Feel free to take some time to set up new users and make yourself feel at home. In particular, let's setup a MySQL user for mabel to use.

    mysql -u root -p
    <Your password here>
    mysql> CREATE USER 'mabel'@'localhost' IDENTIFIED BY 'PASSWORD';
    mysql> GRANT ALL PRIVILEGES ON *.* TO 'mabel'@'localhost';
    mysql> FLUSH PRIVILEGES;

It might be safer to grant fewer privileges but life's too short. You may also like to create the user for any source, rather than just localhost. Do this with `'mabel'@'*'`. This will allow you to log in from home rather than SSHing in and then logging in. 

## Get Mabel

Download the code from github, and install dependencies. Cross your fingers that everything builds correctly.
    
    git clone http://github.com/mabelticketing/mabel;
    cd mabel;
    npm run prepare;

The `prepare` script will ask you for a mysql username and password, and a database to use (it will create the DB if it doesn't already exist.)

Give it a spin with `node app.js`. You should be able to tack ':3008' to the public DNS and see Mabel running! 

Technically, you could just call this a job done because everything should be workable. I want to do a few more things though...

## Forever Configuration

We want the Mabel to pick herself up off her feet if she crashes, and also to start herself up if the server itself crashes. Enter _forever_. Coming soon!

## NGinx Configuration

Let's run things through port 80 rather than 3008. Maybe even alongside our static web server. Also there's no point in introducing the node/express overhead for the Mabel client (i.e. everything but the API endpoints), so let's get nginx to serve them directly. In future, we might like to do this with Amazon S3 for extra performance (it's literally designed for fast static resources) but for now I think this is sufficient.

This is also where we could set up extra redundant instances of Mabel and load balance between them (but I don't think I'm gonna bother doing that). Coming soon!

## DNS Configuration

Let's use our own domain name rather than the lovely URL Amazon has given us. Coming soon!

## Other thoughts

You might like to repeat some of the steps above with a second installation and database, so that you have a staging server and a live server. 

Maybe even password-protect the staging server for kind of free with this: https://www.digitalocean.com/community/tutorials/how-to-set-up-http-authentication-with-nginx-on-ubuntu-12-10.
