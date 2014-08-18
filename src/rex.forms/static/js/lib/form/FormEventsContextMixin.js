/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var EventExecutionContext  = require('../EventExecutionContext');

var FormEventsContextMixin = {

  childContextTypes: {
    formEvents: React.PropTypes.object
  },

  getChildContext: function() {
    return {formEvents: this.formEvents()};
  },

  componentWillUnmount: function() {
    this._eventExecutionContext = null;
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.form !== this.props.form) {
      this._eventExecutionContext = null;
    }
  },

  formEvents: function() {
    return {
      execute: this.executeEventExpression,
      has: this.hasEventExpression,
      isHidden: this.isHiddenByEvents,
      isFailed: this.isFailedByEvents,
      isDisabled: this.isDisabledByEvents,
      isEnumerationHidden: this.isEnumerationHiddenByEvents,
      isCalculated: this.isCalculatedByEvents,
      calculate: this.calculateByEvents
    };
  },

  /**
   * Check if there's event expression with action defined for a terget
   *
   * @param {String} targetID
   * @param {String} action
   * @returns {Boolean}
   */
  hasEventExpression: function(targetID, action) {
    return this.getEventExecutionContext().has(targetID, action);
  },

  /**
   * Execute event expression.
   *
   * @param {String} targetID
   * @param {String} action
   * @param {Value?} value Optional form value, if not provide current form
   *                       value will be used.
   * @returns {Any}
   */
  executeEventExpression: function(targetID, action, value) {
    var executionContext = this.getEventExecutionContext();
    value = value || this.value().value;
    return executionContext.execute(
      targetID, action, this._resolveIdentifier.bind(null, value));
  },

  isEnumerationHiddenByEvents: function(targetID, enumeration, value) {
    if (this.executeEventExpression(targetID, 'hideEnumeration', value)) {
      var actions = this.getEventExecutionContext().getAction(
        targetID,
        'hideEnumeration'
      );

      for (var i=0; i < actions.length; i+=1) {
        var options = actions[i].options || {},
          targettedEnumerations = options.enumerations || [];

        if (targettedEnumerations.indexOf(enumeration) > -1) {
          return true;
        }
      }
    }
    return false;
  },

  isDisabledByEvents: function(targetID, value) {
    return this.executeEventExpression(targetID, 'disable', value);
  },

  isHiddenByEvents: function(targetID, value) {
    return this.executeEventExpression(targetID, 'hide', value);
  },

  isFailedByEvents: function(targetID, value) {
    return this.executeEventExpression(targetID, 'fail', value);
  },

  isCalculatedByEvents: function(targetID) {
    return this.hasEventExpression(targetID, 'calculate');
  },

  calculateByEvents: function(targetID, value) {

    return this.executeEventExpression(targetID, 'calculate', value);
  },

  /**
   * Get event execution context.
   *
   * @returns {EventExecutionContext}
   */
  getEventExecutionContext: function() {
    if (!this._eventExecutionContext
        || this._eventExecutionContext.form !== this.props.form) {
      this._eventExecutionContext = EventExecutionContext.fromForm(
          this.props.form);
    }
    return this._eventExecutionContext;
  },

  /**
   * Resolve identifier for rex.expression evaluator
   *
   * We check if we reference a value of form and if we fail we try to resolve
   * form parameter.
   *
   * @private
   *
   * @param {Array} value
   * @param {String} name
   * @returns {Object}
   */
  _resolveIdentifier: function(value, name) {
    var parameters = this.props.parameters;
    var schema = this.props.schema;

    var isValue = false;

    for (var i = 0, len = name.length; i < len; i++) {
      value = value[name[i]];

      if (value === undefined) {
        if (i === 0 && parameters[name[i]] !== undefined) {
          value = parameters[name[i]];
        } else {
          return null;
        }
      } else {
        isValue = true;
      }

      if (isValue) {
        schema = schema.get(name[i]);
      }
    }

    if (isValue && schema.props.isQuestion) {
      value = value.value;
    }

    return value;
  }
};

module.exports = FormEventsContextMixin;
