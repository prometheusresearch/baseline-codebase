/*
 * Copyright (c) 2014, Prometheus Research, LLC
 */

'use strict';

var webpackConfig = require('rex-setup').configureWebpack({});
//var webpackConfig = require('./webpack.config');


module.exports = function (config) {
  'use strict';

  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-jasmine'),
      require('karma-jasmine-ajax'),
      require('karma-sourcemap-loader'),
      require('karma-phantomjs-launcher'),
      require('karma-phantomjs-shim')
    ],

    frameworks: [
      'jasmine-ajax',
      'jasmine',
      'phantomjs-shim'
    ],

    files: [
      'test/index.js'
    ],

    preprocessors: {
      'test/index.js': [
        'webpack',
        'sourcemap'
      ]
    },

    webpack: webpackConfig,
    /*webpackMiddleware: {
      noInfo: true,
      quiet: true
    },*/

    browsers: [
      'PhantomJS'
    ],

    reporters: [
      'progress'
    ]
  });
};

