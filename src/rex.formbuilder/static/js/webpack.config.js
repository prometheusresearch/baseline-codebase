/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var path = require('path');
var RexSetup = require('rex-setup');


var webpackConfig = RexSetup.configureWebpack({
  entry: [
    // FIXME: This is kinda a boilerplate we require at the moment, but it
    // would be great if rex.widget somehow can inject its own into webpack
    // bundle.
    path.join(__dirname, 'style/index.less'),
    path.join(__dirname, 'lib/index.js'),
    'rex-setup/introspection/loader?all!rex-widget',
    'rex-setup/introspection/loader?all!rex-formbuilder'
  ],

  resolve: {
    alias: {
      'util': require.resolve('webpack/node_modules/node-libs-browser/node_modules/util/util.js'),
      'console': require.resolve('webpack/node_modules/node-libs-browser/node_modules/console-browserify'),
      'date-now': require.resolve('webpack/node_modules/node-libs-browser/node_modules/console-browserify/node_modules/date-now'),
      'inherits': require.resolve('webpack/node_modules/node-libs-browser/node_modules/util/node_modules/inherits/inherits_browser.js'),
      'is-array': require.resolve('webpack/node_modules/node-libs-browser/node_modules/buffer/node_modules/is-array'),
      'ieee754': require.resolve('webpack/node_modules/node-libs-browser/node_modules/buffer/node_modules/ieee754'),
      'base64-js': require.resolve('webpack/node_modules/node-libs-browser/node_modules/buffer/node_modules/base64-js'),
      'react/addons': RexSetup.packagePath('react/addons.js'),
      'react': RexSetup.packagePath('react/addons.js')
    }
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'jsx-loader?harmony=true&es5=true&stripTypes=true'
      }
    ]
  }
});


module.exports = webpackConfig;

