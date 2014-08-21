'use strict';


var LazyString = require('./lazystring').LazyString;
var RexI18N = require('./i18n').RexI18N;

module.exports = {
  LazyString: LazyString,
  RexI18N: RexI18N
};

global.Rex = global.Rex || {};
global.Rex.I18N = module.exports;

