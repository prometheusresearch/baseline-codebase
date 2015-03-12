/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-lesslint');
  grunt.loadNpmTasks('grunt-jsonlint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      project: {
        src: [
          'Gruntfile.js',
          'karma.conf.js',
          'webpack.config.js'
        ]
      },

      source: {
        src: [
          'lib/**/*.js'
        ]
      },

      tests: {
        src: [
          'test/**/*.js'
        ],

        options: {
          envs: [
            'mocha'
          ],

          rules: {
            'no-unused-expressions': false,
            'no-new': false,
            'max-len': [1, 132, 2]
          }
        }
      }
    },

    lesslint: {
      source: {
        src: [
          'style/**/*.less'
        ],
        options: {
          csslint: {
            'box-sizing': false,
            'adjoining-classes': false,
            'outline-none': false
          }
        }
      }
    },

    jsonlint: {
      project: {
        src: [
          'bower.json',
          'package.json',
          '.eslintrc'
        ]
      },

      tests: {
        src: [
          'test/**/*.json'
        ]
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },

      single: {
        singleRun: true,
        browserNoActivityTimeout: 90000  // webpack+rex.setup+rex.widget== SLOW
      },

      watch: {
      }
    },

    watch: {
      lint: {
        files: [
          'lib/**/*',
          'style/**/*',
          'test/**/*'
        ],
        tasks: 'lint:all'
      }
    }
  });

  var originalForceOption = grunt.option('force');

  grunt.registerTask('force', function (set) {
    var option;
    if (set === 'on') {
      option = true;
    } else if (set === 'off') {
      option = false;
    } else if (set === 'restore') {
      option = originalForceOption;
    } else {
      throw new Error('Can only set force to: on, off, restore');
    }

    grunt.option('force', option);
  });

  grunt.registerTask('test', [
    'karma:single'
  ]);
  grunt.registerTask('dev', [
    'karma:watch'
  ]);
  grunt.registerTask('lint', [
    'force:on',
    'eslint:source',
    'lesslint:source',
    'force:restore'
  ]);
  grunt.registerTask('lint:all', [
    'force:on',
    'eslint',
    'lesslint',
    'jsonlint',
    'force:restore'
  ]);
  grunt.registerTask('lint:watch', [
    'watch:lint'
  ]);
  grunt.registerTask('default', [
    'lint',
    'test'
  ]);
};

