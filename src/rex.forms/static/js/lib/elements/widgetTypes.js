/**
 * @jsx React.DOM
 */
'use strict';

var widgetTypes = {
  'float': [
    'inputNumber'
  ],

  'integer': [
    'inputNumber'
  ],

  'text': [
    'inputText',
    'lookupText',
    'textArea'
  ],

  'enumeration': [
    'radioGroup',
    'dropDown'
  ],

  'enumerationSet': [
    'checkGroup',
    'multiSelect'
  ],

  'boolean': [
    'radioGroup',
    'dropDown'
  ],

  'date': [
    'datePicker'
  ],

  'time': [
    'timePicker'
  ],

  'dateTime': [
    'dateTimePicker'
  ],

  'recordList': [
    'recordList'
  ],

  'matrix': [
    'matrix'
  ]
};

module.exports = widgetTypes;
