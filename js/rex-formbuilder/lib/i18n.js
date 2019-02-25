/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


function gettext(msg, params) {
  var {I18NStore} = require('./stores');
  return I18NStore.get().gettext(msg, params).toString();
}


function formatDateTime(dt, format) {
  var {I18NStore} = require('./stores');
  return I18NStore.get().formatDateTime(new Date(dt), format).toString();
}


module.exports = {
  gettext,
  formatDateTime
};

