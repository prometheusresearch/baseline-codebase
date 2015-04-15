/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var errors = require('./errors');
var GUI = require('./gui');
var widget = require('./widget');


module.exports = {
  GUI,
  widget,
  errors
};

global.Rex = global.Rex || {};
global.Rex.FormBuilder = module.exports;

