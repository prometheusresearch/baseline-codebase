var rexSetup = require('rex-setup');

module.exports = function (config) {
    'use strict';

    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'test/**/*.js'
        ],
        exclude: [
        ],
        preprocessors: {
            'test/**/*_spec.js': ['webpack']
        },
        webpack: rexSetup.configureWebpack({
          resolve: {
            alias: {
              'cldr': 'cldrjs',
              'cldrjs/event': 'cldrjs/dist/cldr/event',
              'cldrjs/supplemental': 'cldrjs/dist/cldr/supplemental'
            }
          }
        }),
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: false
    });
};

