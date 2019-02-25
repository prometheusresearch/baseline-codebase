/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var RexI18N = require('rex-i18n');

var InstrumentMenu = require('./InstrumentMenu');
var DraftSetEditor = require('./DraftSetEditor');


function render(component, node, options) {
  var comp = React.render(
    React.createFactory(component)(options),
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

