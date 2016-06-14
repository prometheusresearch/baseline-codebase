/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


module.exports = function (config) {
  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-sourcemap-loader'),
      require('karma-coverage')
    ],

    frameworks: [
      'mocha'
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

    webpack: {
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.json$/,
            loader: 'json-loader'
          },
          {
            test: /\.js$/,
            exclude: /(test|node_modules)\//,
            loader: 'istanbul-instrumenter'
          },
          {
            test: /\.js$/,
            exclude: /node_modules\//,
            loader: 'babel-loader?presets=prometheusresearch'
          }
        ]
      }
    },
    /*webpackMiddleware: {
      noInfo: true,
      quiet: true
    },*/

    browsers: [],

    reporters: [
      'progress',
      'coverage'
    ],

    coverageReporter: {
      reporters: [
        { type: 'html' },
        { type: 'text' }
      ]
    }
  });
};

