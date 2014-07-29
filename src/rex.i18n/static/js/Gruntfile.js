module.exports = function (grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        force: true,
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        es3: true,
        forin: true,
        freeze: true,
        immed: true,
        indent: 2,
        latedef: true,
        newcap: true,
        noarg: true,
        noempty: true,
        nonbsp: true,
        nonew: true,
        quotmark: true,
        undef: true,
        unused: true,
        strict: true,
        maxcomplexity: 10,
        maxlen: 80
      },

      project: {
        src: [
          'Gruntfile.js',
          'karma.conf.js'
        ],

        options: {
          node: true
        }
      },

      source: {
        src: [
          'lib/**/*.js'
        ],

        options: {
          node: true
        }
      },

      tests: {
        src: [
          'test/**/*_spec.js'
        ],

        options: {
          node: true,
          es3: false,
          expr: true,
          maxlen: 120,
          globals: {
            jasmine: false,
            describe: false,
            xdescribe: false,
            it: false,
            xit: false,
            beforeEach: false,
            afterEach: false,
            spyOn: false
          }
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
  grunt.registerTask('lint', ['jshint:project', 'jshint:source']);
  grunt.registerTask('lint:all', 'jshint');

  grunt.registerTask('default', ['lint', 'test']);
};

