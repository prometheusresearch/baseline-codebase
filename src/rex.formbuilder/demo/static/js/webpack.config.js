var path = require('path');
var RexSetup = require('rex-setup');

module.exports = RexSetup.configureWebpack({
    resolve: {
        alias: {
            'react/addons': RexSetup.packagePath('react/react-with-addons.js'),
            'react': RexSetup.packagePath('react/react-with-addons.js'),
            // 'mergesort': 'merge-sort-js/index.js',
            // 'find-insert-index': 'find-insert-index-js/index.js',
            'eonasdan-bootstrap-datetimepicker': 'eonasdan-bootstrap-datetimepicker/src/',
        }
    },

  entry: [
    // FIXME: This is kinda a boilerplate we require at the moment, but it would
    // be great if rex.widget somehow can inject its own into webpack bundle.
    path.join(__dirname, 'style/index.less'),
    'rex-setup/introspection/loader?all!rex-widget',
    'rex-setup/introspection/loader?all!rex-applet',
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
