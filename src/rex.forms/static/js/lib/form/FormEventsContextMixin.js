/**
 * @jsx React.DOM
 */

'use strict';

var React                 = require('react');
var EventExecutionContext = require('../EventExecutionContext');
var _                     = require('../localization')._;
var Resolver              = require('../expressions').Resolver;


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
      has: this.hasEventExpression,
      isHidden: this.isHiddenByEvents,
      isEnumerationHidden: this.isEnumerationHiddenByEvents,
      isDisabled: this.isDisabledByEvents,
      isFailed: this.isFailedByEvents,
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

  _hasLiveEvents: function (targetID, value, actionName) {
    var events = this.getEventExecutionContext().getLiveEvents(
      targetID,
      actionName,
      this.getIdentifierResolver(value)
    );

    return (events.length > 0);
  },

  isHiddenByEvents: function(targetID, value) {
    return this._hasLiveEvents(targetID, value, 'hide');
  },

  isEnumerationHiddenByEvents: function(targetID, enumeration, value) {
    var events = this.getEventExecutionContext().getLiveEvents(
      targetID,
      'hideEnumeration',
      this.getIdentifierResolver(value)
    );

    for (var i = 0; i < events.length; i++) {
      var options = events[i].options || {};
      var targettedEnumerations = options.enumerations || [];

      if (targettedEnumerations.indexOf(enumeration) > -1) {
        return true;
      }
    }

    return false;
  },

  isDisabledByEvents: function(targetID, value) {
    return this._hasLiveEvents(targetID, value, 'disable');
  },

  isFailedByEvents: function(targetID, value) {
    var events = this.getEventExecutionContext().getLiveEvents(
      targetID,
      'fail',
      this.getIdentifierResolver(value)
    );

    for (var i = 0; i < events.length; i++) {
      var options = events[i].options || {};
      var message = this.localize(options.text) || _('Invalid value.');

      return {message};
    }

    return false;
  },

  isCalculatedByEvents: function(targetID, value) {
    return this._hasLiveEvents(targetID, value, 'calculate');
  },

  calculateByEvents: function(targetID, value) {
    var resolver = this.getIdentifierResolver(value);
    var events = this.getEventExecutionContext().getLiveEvents(
      targetID,
      'calculate',
      resolver
    );

    for (var i = 0; i < events.length; i++) {
      var options = events[i].options || {};
      var calculation = options.calculation;

      return this.getEventExecutionContext().evaluate(
        calculation,
        resolver
      );
    }
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

  getIdentifierResolver: function(value) {
    var resolver = new Resolver(
      this.props.schema,
      value || this.value().value,
      this.props.parameters
    );

    return (name) => {
      return resolver.resolveIdentifier(name);
    };
  }
};


module.exports = FormEventsContextMixin;

