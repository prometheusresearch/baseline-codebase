/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var RexI18N = require('rex-i18n');

var InstrumentMenu = require('./InstrumentMenu');
var DraftSetEditor = require('./DraftSetEditor');


function render(Component, node, options) {
  var comp = ReactDOM.render(
    <Component {...options} />,
    node
  );

  RexI18N.onLoad(options.locale, function () {
    comp.forceUpdate();
  });

  return comp;
}


module.exports = {
  render,
  InstrumentMenu,
  DraftSetEditor
};

