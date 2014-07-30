var webpackConfig = require('./webpack.config.js');

module.exports = function (config) {
  'use strict';

  config.set({
    basePath: '',
    frameworks: [
      'jasmine'
    ],
    files: [
      'test/**/*.js'
    ],
    exclude: [
    ],
    preprocessors: {
      'test/**/*_spec.js': ['webpack']
    },
    webpack: webpackConfig,
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};

