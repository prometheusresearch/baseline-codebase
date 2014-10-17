'use strict';

var path      = require('path');
var RexSetup  = require('rex-setup');

function local(p) {
  return path.join(__dirname, p);
}

function vendor(p) {
  return path.join(__dirname, 'vendor', p);
}

module.exports = RexSetup.configureWebpack({
  entry: [
    'style/index.less',
    'lib/index.js'
  ].map(local),

  resolve: {
    alias: {
      // this is because we are using npm dist of React
      'react$': vendor('react/react-with-addons'),
      'react/addons$': vendor('react/react-with-addons'),
      'react-forms': vendor('react-forms')
    }
  }
});
