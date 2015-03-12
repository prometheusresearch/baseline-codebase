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

