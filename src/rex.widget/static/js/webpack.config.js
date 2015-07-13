var RexSetup = require('rex-setup');

module.exports = RexSetup.configureWebpack({

  webtest: {
    entry: [
      require.resolve('core-js/modules/es6.object.assign'),
      require.resolve('core-js/modules/es6.promise'),
      './lib/forms/__tests__/*-test.js'
    ]
  }
});
