/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var RexSetup = require('rex-setup');


var webpackConfig = RexSetup.configureWebpack({
  resolve: {
    alias: {
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

