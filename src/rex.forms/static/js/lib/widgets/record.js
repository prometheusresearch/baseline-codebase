/**
 * @jsx React.DOM
 */
'use strict';

var React      = require('react');
var ReactForms = require('react-forms');
var DirtyState = require('./DirtyState');
var _          = require('../localization')._;


var record = React.createClass({
  mixins: [
    ReactForms.FieldsetMixin,
    DirtyState
  ],

  onRemove: function () {
    if (this.props.onRemove) {
      this.props.onRemove(this.props.name);
    }
  },

  render: function () {
    return (
      <div className="rex-forms-recordList__record">
        {!this.props.readOnly &&
          <button
            className="rex-forms-recordList__remove"
            onClick={this.onRemove}
            type="button">
            &times; {_('Remove')}
          </button>}
        {this.renderQuestions()}
      </div>
    );
  },

  renderQuestions: function() {
    // prevent circular import
    var Question = require('../elements').Question;
    return this.props.questions.map((question, idx) => {
      return (
        <Question
          readOnly={this.props.readOnly}
          key={question.fieldId}
          name={question.fieldId}
          options={question}
          widgetProps={{
            onDirty: this.markDirty,
            dirty: this.isDirty()
          }}
          />
      );
    });
  },

  getInitialDirtyState: function() {
    return false;
  }
});

module.exports = record;
