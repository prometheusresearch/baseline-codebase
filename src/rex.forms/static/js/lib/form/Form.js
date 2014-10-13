/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var ReactForms             = require('react-forms');
var validation             = ReactForms.validation;
var makeAssessment         = require('../assessment').makeAssessment;
var createSchema           = require('../createSchema').createSchema;
var FormEntry              = require('./FormEntry');
var FormOverview           = require('./FormOverview');
var FormEventsContextMixin = require('./FormEventsContextMixin');
var FormLocalizerMixin     = require('./FormLocalizerMixin');
var WidgetConfiguration    = require('./WidgetConfiguration');
var _                      = require('../localization')._;


var Form = React.createClass({
  mixins: [
    FormLocalizerMixin,
    ReactForms.FormMixin,
    FormEventsContextMixin,
    WidgetConfiguration.ContextMixin
  ],

  propTypes: {
    instrument: React.PropTypes.object.isRequired,
    form: React.PropTypes.object.isRequired,
    assessment: React.PropTypes.object,
    parameters: React.PropTypes.object,
    locale: React.PropTypes.string,
    onComplete: React.PropTypes.func,
    showOverview: React.PropTypes.bool,
    showOverviewOnCompletion: React.PropTypes.bool,
    readOnly: React.PropTypes.bool
  },

  render: function() {
    var isValid = this.isValid();
    var form;

    if (this.state.showOverview || this.props.showOverview) {
      form = this.transferPropsTo(
        <FormOverview
          ref="form"
          readOnly={this.props.readOnly || this.state.completed}
          isValid={isValid}
          isFieldValid={this.isFieldValid}
          startEditTransaction={this.startEditTransaction}
          commitEditTransaction={this.commitEditTransaction}
          rollbackEditTransaction={this.rollbackEditTransaction}
          />
      );
    } else {
      form = this.transferPropsTo(
        <FormEntry
          ref="form"
          isValid={isValid}
          isFieldValid={this.isFieldValid}
          />
      );
    }

    var buttonLabel = (this.state.showOverview || this.props.showOverview) ?
      _('Complete Form') :
      _('Review Responses');

    return (
      <div className="rex-forms-Form">
        {form}
        {!this.props.readOnly &&
          <div className="rex-forms-Form__toolbar clearfix">
            <button
              disabled={!isValid || this.state.completed}
              onClick={this.onComplete}
              type="button"
              className="rex-forms-Form__complete">
              {buttonLabel}
            </button>
          </div>}
      </div>
    );
  },

  getDefaultProps: function() {
    var schema = this.props.schema || createSchema(
      this.props.instrument,
      this.props.form
    );

    var defaultValue = {};
    if (this.props.assessment) {
      defaultValue = this.props.assessment.values;

      for (var fieldID in defaultValue) {
        if (defaultValue[fieldID].value !== null) {
          continue;
        }

        var type = schema.get(fieldID).children.value.props.instrumentType;
        if (type.rootType === 'matrix') {
          // There are situations that may lead to the value of a matrix field
          // being set to null. While this is perfectly valid for an
          // Assessment Document, this can cause problems down the line (e.g.,
          // event processing), so we'll swap it out for an empty object.
          defaultValue[fieldID].value = {};
        }
      }
    }

    return {
      defaultValue: defaultValue,
      schema: schema,
      parameters: {},
      locale: 'en'
    };
  },

  getInitialState: function() {
    return {
      showOverview: false,
      completed: false,
      commitedValue: null
    };
  },

  startEditTransaction: function() {
    this.setState({commitedValue: this.state.value});
  },

  commitEditTransaction: function() {
    this.setState({commitedValue: null});
  },

  rollbackEditTransaction: function() {
    this.onValueUpdate(this.state.commitedValue);
  },

  getFormState: function(value) {
    var events = this.formEvents();
    this.getEventExecutionContext().forEachField((name) => {
      if (/\./.test(name)) {
        // TODO: For the time being, we don't allow calculations or failures of
        // subfields.
        return;
      }
      if (!(name in value.schema.children)) {
        // If it's a name we don't recognize at this level, we'll ignore it,
        // assuming it's a subfield.
        return;
      }

      if (events.isCalculated(name, value)) {
        var newValue = events.calculate(name, value);

        if (newValue !== undefined
            && (!value.value[name] || !value.value[name].value !== newValue)) {

          value = value
            .get(name).get('value')
            .updateValue(newValue)
            .root();
        }
      }

      var failed = events.isFailed(name, value);
      if (failed) {
        value = value.get(name).get('value');
        value = value
          .updateValidation({validation: {failure: failed.message, forceError: true}})
          .root();
      } else if (validation.isFailure(value.get(name).get('value').validation)) {
        value = value.get(name).get('value');
        value = value
          .updateValue(value.value)
          .root();
      }
    });

    return {value};
  },

  /**
   * Return true if form is valid
   *
   * @returns {Boolean}
   */
  isValid: function(value) {
    for (var i = 0, len = this.props.instrument.record.length; i < len; i++) {
      if (!this.isFieldValid(this.props.instrument.record[i].id, value)) {
        return false;
      }
    }
    return true;
  },

  /**
   * Return true if field with fieldId is valid in the current form state
   *
   * @returns {Boolean}
   */
  isFieldValid: function(fieldId, value) {
    value = value || this.value();
    var events = this.formEvents();
    return validation.isSuccess(value.validation.children[fieldId])
      || events.isHidden(fieldId, value)
      || events.isDisabled(fieldId, value);
  },

  /**
   * Return an assessment document for the current form state.
   *
   * @returns {Assessment}
   */
  getAssessment: function(value) {
    value = value || this.value();
    // We iterate over all actions and decide if we should remove assessment
    // values from hidden/disabled fields.
    //
    // We don't remove values from original form value because if field become
    // enabled/visible again we want to show retained value and not a clean
    // state.
    var valueOverlay = {};

    var events = this.formEvents();

    this.getEventExecutionContext().forEachField((name) => {
      if (events.isHidden(name, value) || events.isDisabled(name, value)) {
        valueOverlay[name] = {value: null};
      }
    });

    return makeAssessment(
      value.value,
      this.props.instrument,
      valueOverlay
    );
  },

  onComplete: function() {
    if (this.isValid() && this.props.onComplete && !this.state.completed) {
      var value = this.value();
      // check if we need to show overview before completion
      if (this.props.showOverviewOnCompletion && !this.state.showOverview) {
        this.setState({showOverview: true});
        if (this.props.onReview) {
          this.props.onReview(this.getAssessment(value));
        }
      } else {
        this.setState({completed: true});
        if (this.props.onComplete) {
          this.props.onComplete(this.getAssessment(value));
        }
      }
    }
  },

  valueUpdated: function(value) {
    var isValid = this.isValid(value);
    var assessment = this.getAssessment(value);
    if (this.props.onChange && isValid) {
      this.props.onChange(assessment);
    }
    if (this.props.onUpdate) {
      this.props.onUpdate(assessment, isValid);
    }
  }
});

module.exports = {
  Form: Form,
  FormLocalizerMixin: FormLocalizerMixin
};

