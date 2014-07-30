var rexSetup = require('rex-setup');

module.exports = rexSetup.configureWebpack({
  resolve: {
    alias: {
      'cldr': 'cldrjs',
      'cldrjs/event': 'cldrjs/dist/cldr/event',
      'cldrjs/supplemental': 'cldrjs/dist/cldr/supplemental'
    }
  }
});

