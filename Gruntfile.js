module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            dist: {
                src: 'js/carousel.js',
                dest: 'js/carousel.min.js'
            }
        },
        connect: {
            server: {
                options: {
                    open: true,
                    hostname: '192.168.1.8',
                    port: 9000
                }
            }
        },

        watch: {
            scripts: {
                files: ['js/*.js'],
                tasks: ['uglify'],
                options: {
                    spawn: false,
                    livereload: true
                },
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['uglify','connect','watch']);

};