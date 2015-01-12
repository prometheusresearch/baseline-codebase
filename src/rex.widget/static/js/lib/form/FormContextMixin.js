/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var React = require('react');

var ContextTypes = {
  valueKey: React.PropTypes.array
};

var FormContextMixin = {

  contextTypes: ContextTypes,

  childContextTypes: ContextTypes,

  getChildContext() {
    var valueKey = this.getValueKey();
    return {valueKey};
  },

  getValueKey() {
    var valueKey = this.context && this.context.valueKey ?
      this.context.valueKey.concat(this.props.valueKey) :
      [];
    return valueKey;
  },

  getValue() {
    return this.props.value.getIn(this.getValueKey());
  }
};

module.exports = FormContextMixin;
