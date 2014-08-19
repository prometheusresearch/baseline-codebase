/**
 * @jsx React.DOM
 */
'use strict';

var EnumerationMixin  = require('./EnumerationMixin');
var WidgetMixin       = require('./WidgetMixin');


var EnumerationWidgetMixin = {
  mixins: [
    EnumerationMixin,
    WidgetMixin
  ]
};

module.exports = EnumerationWidgetMixin;
