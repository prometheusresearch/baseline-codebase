/*
 * Copyright (c) 2014, Prometheus Research, LLC
 */

'use strict';


module.exports = function (grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      test: {
        files: [
          'test/**/*.js',
          'lib/**/*.js'
        ],
        tasks: [
          'karma:single'
        ]
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

  grunt.registerTask('test', ['karma:single']);
  grunt.registerTask('dev', ['karma:single', 'watch']);

  grunt.registerTask('default', ['lint', 'test']);
};

