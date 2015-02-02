module.exports = function(grunt) {

    // there might be a more concise way of doing the filename matching but hey
    grunt.initConfig({
        jade: {
            compile: {
                files: {
                    "./compiled_html/index.html": "./views/index.jade",
                    "./compiled_html/dash/index.html": "./views/dash.jade",
                    "./compiled_html/book/index.html": "./views/book.jade",
                    "./compiled_html/admin/index.html": "./views/admin/dash.jade",
                    "./compiled_html/admin/event/index.html": "./views/admin/event.jade",
                    "./compiled_html/admin/tickets.html": "./views/admin/tickets.jade",
                    "./compiled_html/admin/transactions.html": "./views/admin/transactions.jade",
                    "./compiled_html/admin/users/index.html": "./views/admin/users.jade",
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jade');

};
