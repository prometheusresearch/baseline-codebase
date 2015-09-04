/**
 * @jsx React.DOM
 */

'use strict';

var React                 = require('react');
var EventExecutionContext = require('../EventExecutionContext');
var _                     = require('../localization')._;
var Resolver              = require('../expressions').Resolver;
var utils                 = require('../utils');


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

  _getLiveEvents: function (targetID, actionName, scopedValue) {
    var scopes = [];
    scopes.push([targetID, scopedValue]);
    if (scopedValue && scopedValue.parent) {
      scopes.push([this.getFullTargetID(targetID, scopedValue), null]);
    }

    var events = [];
    for (var i = 0; i < scopes.length; i++) {
      events = events.concat(this.getEventExecutionContext().getLiveEvents(
        scopes[i][0],
        actionName,
        this.getIdentifierResolver(scopes[i][1])
      ));
    }

    return events;
  },

  _hasLiveEvents: function (targetID, actionName, scopedValue) {
    var events = this._getLiveEvents(targetID, actionName, scopedValue);
    return (events.length > 0);
  },

  isHiddenByEvents: function(targetID, scopedValue) {
    return this._hasLiveEvents(targetID, 'hide', scopedValue);
  },

  isEnumerationHiddenByEvents: function(targetID, enumeration, scopedValue) {
    var events = this._getLiveEvents(targetID, 'hideEnumeration', scopedValue);

    for (var i = 0; i < events.length; i++) {
      var options = events[i].options || {};
      var targettedEnumerations = options.enumerations || [];

      if (targettedEnumerations.indexOf(enumeration) > -1) {
        return true;
      }
    }

    return false;
  },

  isDisabledByEvents: function(targetID, scopedValue) {
    return this._hasLiveEvents(targetID, 'disable', scopedValue);
  },

  isFailedByEvents: function(targetID, scopedValue) {
    var events = this.getEventExecutionContext().getLiveEvents(
      targetID,
      'fail',
      this.getIdentifierResolver(scopedValue)
    );

    for (var i = 0; i < events.length; i++) {
      var options = events[i].options || {};
      var message = this.localize(options.text) || _('Invalid value.');

      return {message};
    }

    return false;
  },

  isCalculatedByEvents: function(targetID, scopedValue) {
    return this._hasLiveEvents(targetID, 'calculate', scopedValue);
  },

  calculateByEvents: function(targetID, scopedValue) {
    var resolver = this.getIdentifierResolver(scopedValue);
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
  getEventExecutionContext: function () {
    if (!this._eventExecutionContext
        || this._eventExecutionContext.form !== this.props.form) {
      this._eventExecutionContext = EventExecutionContext.fromForm(
          this.props.form);
    }

    // Install a sidedoor that lets us tap into REXL from the browser console.
    global.REX_FORMS_EVALUATOR = (expression) => {
      return this._eventExecutionContext.evaluate(
        expression,
        this.getIdentifierResolver()
      );
    };

    return this._eventExecutionContext;
  },

  getFullTargetID: function (targetID, value) {
    var fullID = targetID;

    if (value.path[0] !== targetID) {
      // This is a hacky way to get the fully qualified name of a subfield.
      if (utils.isNumber(value.path[2])) {
        // Looks like a recordList subfield.
        fullID = value.path[0] + '.' + targetID;
      } else {
        // Looks like a matrix subfield.
        fullID = value.path[0] + '.' + value.path[2] + '.' + targetID;
      }
    }

    return fullID;
  },

  getIdentifierResolver: function (value) {
    value = value || this.value();
    var resolver = new Resolver(
      value.schema,
      value.value,
      this.props.parameters
    );

    return (name) => {
      return resolver.resolveIdentifier(name);
    };
  }
};


module.exports = FormEventsContextMixin;

