/**
 * Copyright (c) 2015, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';

var RexI18N = require('rex-i18n');


var getI18N = function () {
  return RexI18N.getInstance();
};

var gettext = function (msg, variables) {
  return getI18N().gettext(msg, variables).toString();
};

var switchLocale = function (locale, callback) {
  RexI18N.setDefaultLocale(locale);
  RexI18N.onLoad(locale, callback);
};


module.exports = {
  getI18N: getI18N,
  gettext: gettext,
  switchLocale
};

