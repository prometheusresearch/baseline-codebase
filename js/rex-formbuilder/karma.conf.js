/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var webpackConfig = require('rex-setup').configureWebpack({});
//var webpackConfig = require('./webpack.config');


webpackConfig.devtool = 'inline-source-map';
webpackConfig.module.loaders.push({
  test: /\.json$/,
  loader: 'json'
});
webpackConfig.module.postLoaders = webpackConfig.module.loaders.postLoaders
    || [];
webpackConfig.module.postLoaders.push({
  test: /\.js$/,
  exclude: /(test|node_modules)\//,
  loader: 'istanbul-instrumenter'
});


module.exports = function (config) {
  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-coverage'),
      require('karma-sourcemap-loader'),
      require('karma-mocha'),
      require('karma-phantomjs-launcher'),
      require('karma-phantomjs-shim')
    ],

    frameworks: [
      'mocha',
      'phantomjs-shim'
    ],

    files: [
      'node_modules/babel-core/browser-polyfill.js',
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
        //{ type: 'text' },
        { type: 'text-summary' }
      ]
    }
  });
};

