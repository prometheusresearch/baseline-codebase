module.exports = function (grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-karma');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jslint: {
            project: {
                src: [
                    'Gruntfile.js',
                    'karma.conf.js'
                ],
                directives: {
                    node: true
                },
                options: {
                    failOnError: false
                }
            },

            source: {
                src: [
                    'lib/**/*.js'
                ],
                directives: {
                    node: true
                },
                options: {
                    failOnError: false
                }
            },

            tests: {
                src: [
                    'test/**/*_spec.js'
                ],
                directives: {
                    node: true,
                    predef: [
                        'jasmine',
                        'describe',
                        'xdescribe',
                        'it',
                        'xit',
                        'beforeEach',
                        'afterEach',
                        'spyOn'
                    ]
                },
                options: {
                    failOnError: false
                }
            }
        },

        karma: {
            options: {
                configFile: 'karma.conf.js'
            },

            single: {
                singleRun: true
            },

            watch: {
            }
        }
    });

    grunt.registerTask('test', 'karma:single');
    grunt.registerTask('dev', 'karma:watch');
    grunt.registerTask('lint', ['jslint:project', 'jslint:source']);
    grunt.registerTask('lint:all', 'jslint');

    grunt.registerTask('default', ['lint', 'test']);
};

