/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var RexI18N = require('rex-i18n');


function getRex() {
  return RexI18N.getInstance();
}


function gettext(msg, params) {
  var i18n = getRex();
  return i18n.gettext(msg, params).toString();
}


function getCurrentLocale() {
  var i18n = getRex();
  return i18n.config.locale;
}

function formatDateTime(dt, format) {
  var i18n = getRex();
  return i18n.formatDateTime(new Date(dt), format).toString();
}


module.exports = {
  getRex,
  gettext,
  getCurrentLocale,
  formatDateTime
};

