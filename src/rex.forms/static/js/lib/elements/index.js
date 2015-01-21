/**
 * @jsx React.DOM
 */

'use strict';

var Audio           = require('./Audio');
var Divider         = require('./Divider');
var Header          = require('./Header');
var Question        = require('./Question').Question;
var RawValueDisplay = require('./RawValueDisplay');
var Text            = require('./Text');


var defaultElementComponentMap = {
  audio: Audio,
  header: Header,
  text: Text,
  divider: Divider,
  question: Question,
  rawValueDisplay: RawValueDisplay
};


module.exports = {
  defaultElementComponentMap,
  Audio,
  Question,
  Header,
  Divider,
  Text,
  RawValueDisplay
};

