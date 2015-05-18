var webpackConfig = require('rex-setup/webpack.config');

webpackConfig.zuul = {
  entry: require.resolve('rex-setup/polyfills/object-assign')
};

module.exports = {
  ui: 'jasmine',
  builder: 'zuul-builder-webpack',
  webpack: webpackConfig
};
