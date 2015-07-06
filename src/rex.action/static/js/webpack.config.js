var RexSetup = require('rex-setup');

module.exports = RexSetup.configureWebpack({

  webtest: {
    entry: [
      //require.resolve('rex-setup/polyfills/object-assign'),
      './lib/**/__tests__/*-test.js'
    ]
  }
});
