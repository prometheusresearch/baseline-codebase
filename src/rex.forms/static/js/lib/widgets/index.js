/**
 * @jsx React.DOM
 */
'use strict';

var annotation           = require('./annotation');
var explanation          = require('./explanation');
var inputNumber          = require('./inputNumber');
var checkGroup           = require('./checkGroup');
var radioGroup           = require('./radioGroup');
var dropDown             = require('./dropDown');
var recordList           = require('./recordList');
var textArea             = require('./textArea');
var inputText            = require('./inputText');
var inputDateTime        = require('./inputDateTime');
var matrix               = require('./matrix');
var value                = require('./value');
var readOnlyAnnotation   = require('./readOnlyAnnotation');
var readOnlyExplanation  = require('./readOnlyExplanation');
var readOnlyRecordList   = require('./readOnlyRecordList');
var readOnlyMatrix       = require('./readOnlyMatrix');

var defaultWidgetMap = {
  explanation,
  annotation,

  inputText,
  inputNumber,
  textArea,

  radioGroup,
  checkGroup,
  dropDown,

  datePicker: inputDateTime,
  timePicker: inputDateTime,
  dateTimePicker: inputDateTime,

  recordList,
  matrix,

  readOnlyExplanation,
  readOnlyAnnotation,

  readOnlyInputText: value,
  readOnlyInputNumber: value,
  readOnlyTextArea: value,

  readOnlyRadioGroup: value,
  readOnlyDropDown: value,
  readOnlyCheckGroup: value,

  readOnlyDatePicker: value,
  readOnlyTimePicker: value,
  readOnlyDateTimePicker: value,

  readOnlyRecordList: readOnlyRecordList,
  readOnlyMatrix: readOnlyMatrix
};

module.exports = {defaultWidgetMap};
