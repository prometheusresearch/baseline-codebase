/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var FormEventsContextMixin = require('./FormEventsContextMixin');

var FormEventsMixin = {

  contextTypes: FormEventsContextMixin.childContextTypes,

  formEvents: function() {
    return this.context.formEvents;
  }
};

module.exports = FormEventsMixin;
