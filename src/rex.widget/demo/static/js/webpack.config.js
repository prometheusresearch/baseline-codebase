var path = require('path');
var RexSetup = require('rex-setup');

module.exports = RexSetup.configureWebpack({
  entry: [
    // FIXME: This is kinda a boilerplate we require at the moment, but it would
    // be great if rex.widget somehow can inject its own into webpack bundle.
    path.join(__dirname, 'style/index.less'),
    'rex-setup/introspection/loader?all!rex-widget-demo',
    'rex-setup/introspection/loader?all!rex-widget',
    //'rex-setup/introspection/loader?all!rex-charts'
  ],

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
