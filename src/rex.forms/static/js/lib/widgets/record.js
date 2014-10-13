/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react');
var ReactForms      = require('react-forms');
var DirtyState      = require('./DirtyState');
var _               = require('../localization')._;
var FormEventsMixin = require('./../form/FormEventsMixin');
var utils           = require('../utils');


var record = React.createClass({
  mixins: [
    ReactForms.FieldsetMixin,
    DirtyState,
    FormEventsMixin
  ],

  onRemove: function () {
    if (this.props.onRemove) {
      this.props.onRemove(this.props.name);
    }
  },

  render: function () {
    var removeText = this.props.removeLabelText || _('Remove');
    return (
      <div className="rex-forms-recordList__record">
        {!this.props.readOnly &&
          <button
            className="rex-forms-recordList__remove"
            disabled={this.props.disabled}
            onClick={this.onRemove}
            type="button">
            &times; {removeText}
          </button>}
        {this.renderQuestions()}
      </div>
    );
  },

  renderQuestions: function() {
    // prevent circular import
    var Question = require('../elements').Question;

    var events = this.formEvents();
    var localValue = this.value();

    return this.props.questions.map((question, idx) => {
      var disabled = this.props.disabled ||
        events.isDisabled(question.fieldId, localValue);
      var hidden = events.isHidden(question.fieldId, localValue);

      return (
        <Question
          readOnly={this.props.readOnly}
          key={question.fieldId}
          name={question.fieldId}
          ref={question.fieldId}
          options={question}
          disabled={disabled}
          hidden={hidden}
          onNext={this.onNext}
          widgetProps={{
            onDirty: this.markDirty,
            dirty: this.isDirty()
          }}
          />
      );
    });
  },

  getDefaultProps: function() {
    return {onNext: utils.emptyFunction};
  },

  getInitialDirtyState: function() {
    return false;
  },

  focus: function() {
    if (this.props.questions.length > 0) {
      var fieldId = this.props.questions[0].fieldId;
      this.refs[fieldId].focus();
    }
  },

  onNext: function(name) {
    var next = utils.findAfter(this.props.questions, (q) => q.fieldId, name);
    if (next) {
      this.refs[next].focus();
    } else {
      this.props.onNext(this.props.name);
    }
  }
});

module.exports = record;
