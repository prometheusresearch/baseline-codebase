/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var errors = require('./errors');
var GUI = require('./gui');
var widget = require('./widget');
var PickDraft = require('./widget/action/PickDraft');
var EditDraft = require('./widget/action/EditDraft');
var DraftSetEditor = require('./gui/DraftSetEditor');
var InstrumentMenu = require('./gui/InstrumentMenu');
var I18NWidget = require('./widget/I18NWidget');

module.exports = {
  GUI,
  widget,
  errors,
  PickDraft,
  EditDraft,
  DraftSetEditor,
  InstrumentMenu,
  I18NWidget,
};

global.Rex = global.Rex || {};
global.Rex.FormBuilder = module.exports;

