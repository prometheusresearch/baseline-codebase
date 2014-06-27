/**
 * @jsx React.DOM
 */
'use strict';

var FormEventsContextMixin = require('./FormEventsContextMixin');

var FormEventsMixin = {

  contextTypes: FormEventsContextMixin.childContextTypes,

  formEvents: function() {
    return this.context.formEvents;
  }
};

module.exports = FormEventsMixin;
