var configureWebpack = require('rex-setup').configureWebpack;

module.exports = configureWebpack({
  entry: [
    // FIXME: This is kinda a boilerplate we require at the moment, but it would
    // be great if rex.widget somehow can inject its own into webpack bundle.
    'rex-widget/style/index.less',
    'rex-setup/introspection/loader?all!rex-widget'
  ]
});
