module.exports = function(grunt) {

    // there might be a more concise way of doing the filename matching but hey
    grunt.initConfig({
        jade: {
            compile: {
                files: {
                    "./assets/index.html": "./views/index.jade",
                    "./assets/dash.html": "./views/dash.jade",
                    "./assets/book.html": "./views/book.jade",
                    "./assets/admin.html": "./views/admin/dash.jade",
                    "./assets/admin/event.html": "./views/admin/event.jade",
                    "./assets/admin/tickets.html": "./views/admin/tickets.jade",
                    "./assets/admin/transactions.html": "./views/admin/transactions.jade",
                    "./assets/admin/users.html": "./views/admin/users.jade",
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jade');

};
