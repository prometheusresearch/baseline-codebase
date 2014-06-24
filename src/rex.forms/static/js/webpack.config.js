var rexSetup = require('rex-setup');

module.exports = rexSetup.configureWebpack({
  loaders: [
    {
      test: /tests\/.+\.js$/,
      loader: 'mocha'
    }
  ],
  node: {
    assert: false
  }
});
