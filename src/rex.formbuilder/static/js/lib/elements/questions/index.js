/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var Question = require('./Question');
var ShortText = require('./ShortText');
var LongText = require('./LongText');
var Integer = require('./Integer');
var Float = require('./Float');
var BooleanQuestion = require('./Boolean');
var RadioButtonGroup = require('./RadioButtonGroup');
var DropDownMenu = require('./DropDownMenu');
var CheckBoxGroup = require('./CheckBoxGroup');


module.exports = {
  Question,
  ShortText,
  LongText,
  Integer,
  Float,
  Boolean: BooleanQuestion,
  RadioButtonGroup,
  DropDownMenu,
  CheckBoxGroup
};

