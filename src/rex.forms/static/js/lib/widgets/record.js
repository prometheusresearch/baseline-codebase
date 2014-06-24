/**
 * @jsx React.DOM
 */
'use strict';

var React      = require('react');
var ReactForms = require('react-forms');
var cx         = React.addons.classSet;
var DirtyState = require('./DirtyState');

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
    var className = cx(
      'remove btn btn-default',
      'btn-xs pull-right',
      'rex-forms-recordList__remove'
    );
    return (
      <div className="rex-forms-recordList__record">
        {!this.props.readOnly &&
          <button className={className} onClick={this.onRemove} type="button">
            &times; remove
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
