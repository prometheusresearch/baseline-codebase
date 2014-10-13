/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var ContextTypes = {
  widgetTypes: React.PropTypes.object,
  readOnlyWidgetTypes: React.PropTypes.object
};

var ContextMixin = {
  childContextTypes: ContextTypes,

  getChildContext() {
    var {widgetTypes, readOnlyWidgetTypes} = this.props;
    return {widgetTypes, readOnlyWidgetTypes};
  },

  getDefaultProps() {
    return {
      widgetTypes: require('../elements/widgetTypes'),
      readOnlyWidgetTypes: require('../elements/readOnlyWidgetTypes')
    };
  }
};

var Mixin = {
  contextTypes: ContextTypes,

  getWidgetTypes() {
    return this.context.widgetTypes;
  },

  getReadOnlyWidgetTypes() {
    return this.context.readOnlyWidgetTypes;
  }
};

var WidgetConfiguration = {
  ContextMixin,
  Mixin
};

module.exports = WidgetConfiguration;
