var path = require('path');
var configureWebpack = require('rex-setup').configureWebpack;

var global_modules = path.join(
  process.env.NPM_CONFIG_PREFIX,
  'lib/bower_components');

function global(p) {
  return path.join(global_modules, p);
}

module.exports = configureWebpack({
  entry: [
    // FIXME: This is kinda a boilerplate we require at the moment, but it would
    // be great if rex.widget somehow can inject its own into webpack bundle.
    path.join(__dirname, 'style/index.less'),
    'rex-setup/introspection/loader?all!rex-widget-demo',
    'rex-setup/introspection/loader?all!rex-widget'
  ],

  resolve: {
    alias: {
      // this is because we are using npm dist of React
      'react': global('react'),
      'react/addons': global('react/addons')
    }
  }
});
