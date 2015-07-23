var RexSetup = require('rex-setup');

module.exports = RexSetup.configureWebpack({

  webtest: {
    entry: ['lib/**/__tests__/*-test.js']
  }
});
