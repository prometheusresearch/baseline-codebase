/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react');
var List          = require('./list');
var Editor        = require('./editor/InstrumentEditor');

function startEditor(props, domElement) {
  return React.render(<Editor {...props} />, domElement);
}

module.exports = {
  List,
  startEditor
};

if (window) {
  window.React = window.React || require('react');
  window.Rex = window.Rex || {};
  window.Rex.FormBuilder = module.exports;
}
