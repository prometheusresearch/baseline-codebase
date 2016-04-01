/**
 * @jsx React.DOM
 */
'use strict';

var readOnlyWidgetTypes = {
  'float': [
    'readOnlyInputNumber'
  ],

  'integer': [
    'readOnlyInputNumber'
  ],

  'text': [
    'readOnlyInputText',
    'readOnlyLookupText',
    'readOnlyTextArea'
  ],

  'enumeration': [
    'readOnlyRadioGroup',
    'readOnlyDropDown'
  ],

  'enumerationSet': [
    'readOnlyCheckGroup',
    'readOnlyMultiSelect'
  ],

  'boolean': [
    'readOnlyRadioGroup',
    'readOnlyDropDown'
  ],

  'date': [
    'readOnlyDatePicker'
  ],

  'time': [
    'readOnlyTimePicker'
  ],

  'dateTime': [
    'readOnlyDateTimePicker'
  ],

  'recordList': [
    'readOnlyRecordList'
  ],

  'matrix': [
    'readOnlyMatrix'
  ]
};

module.exports = readOnlyWidgetTypes;
