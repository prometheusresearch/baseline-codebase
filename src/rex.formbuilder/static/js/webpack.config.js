'use strict';

var path      = require('path');
var RexSetup  = require('rex-setup');

function local(p) {
  return path.join(__dirname, p);
}

module.exports = RexSetup.configureWebpack({
  entry: [
    'style/index.less',
    'lib/index.js'
  ].map(local),

  resolve: {
    alias: {
      // this is because we are using npm dist of React
      'react/addons': RexSetup.packagePath('react/react-with-addons.js'),
      'react': RexSetup.packagePath('react/react-with-addons.js')
    }
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'jsx-loader?harmony=true&es5=true&stripTypes=true'
      },
      {
        test: /\.woff2$/,
        loader: 'url-loader?prefix=font/&limit=5000'
      }
    ]
  }
});
