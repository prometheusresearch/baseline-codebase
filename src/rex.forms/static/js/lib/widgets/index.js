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
var lookupText           = require('./lookupText');
var matrix               = require('./matrix');
var value                = require('./value');
var enumeratedValue      = require('./enumeratedValue');
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
  entryRadioGroup: radioGroup,
  checkGroup,
  entryCheckGroup: checkGroup,
  dropDown,

  datePicker: inputDateTime,
  timePicker: inputDateTime,
  dateTimePicker: inputDateTime,

  lookupText,

  recordList,
  matrix,

  readOnlyExplanation,
  readOnlyAnnotation,

  readOnlyInputText: value,
  readOnlyInputNumber: value,
  readOnlyTextArea: value,

  readOnlyRadioGroup: enumeratedValue,
  readOnlyDropDown: enumeratedValue,
  readOnlyCheckGroup: enumeratedValue,

  readOnlyDatePicker: value,
  readOnlyTimePicker: value,
  readOnlyDateTimePicker: value,

  readOnlyLookupText: value,

  readOnlyRecordList: readOnlyRecordList,
  readOnlyMatrix: readOnlyMatrix
};

module.exports = {defaultWidgetMap};
