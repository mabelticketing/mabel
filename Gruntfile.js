module.exports = function(grunt) {

    // there might be a more concise way of doing the filename matching but hey
    grunt.initConfig({
        jade: {
            compile: {
                files: {
                    "./assets/index.html": "./views/index.jade",
                    "./assets/dash/index.html": "./views/dash.jade",
                    "./assets/book/index.html": "./views/book.jade",
                    "./assets/admin/index.html": "./views/admin/dash.jade",
                    "./assets/admin/event/index.html": "./views/admin/event.jade",
                    "./assets/admin/tickets/index.html": "./views/admin/tickets.jade",
                    "./assets/admin/transactions/index.html": "./views/admin/transactions.jade",
                    "./assets/admin/users/index.html": "./views/admin/users.jade",
                }
            }
        },
        sass: {
          options: {
              style: 'compressed'
          },
          dist: {
            files: [{
              expand: true,
              cwd: 'assets/scss',
              src: ['main.scss'],
              dest: 'assets/css',
              ext: '.min.css'
            }]
          }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-jade');

};
