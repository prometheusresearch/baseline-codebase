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
              'cldr/supplemental': 'cldrjs/dist/cldr/supplemental',
              'cldrjs/supplemental': 'cldrjs/dist/cldr/supplemental'
            }
          },
          devtool: 'source-map'
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

