/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var path = require('path');
var webpackConfig = require('./webpack.config');


webpackConfig.resolve.root.push(path.join(__dirname, 'node_modules'));
webpackConfig.devtool = 'inline-source-map';
webpackConfig.module.loaders.push({
  test: /\.json$/,
  loader: 'json'
});
webpackConfig.module.postLoaders = webpackConfig.module.loaders.postLoaders
    || [];
webpackConfig.module.postLoaders.push({
  test: /\.js$/,
  exclude: /(test|node_modules|bower_components)\//,
  loader: 'istanbul-instrumenter'
});


module.exports = function (config) {
  config.set({
    frameworks: [
      'mocha',
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
    webpackMiddleware: {
      noInfo: true,
      quiet: true
    },

    browsers: [
      'PhantomJS'
    ],

    reporters: [
      'progress',
      'coverage'
    ],

    coverageReporter: {
      reporters: [
        { type: 'html' },
        { type: 'text' },
        { type: 'text-summary' }
      ]
    }
  });
};

