/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var Question  = require('../elements').Question;
var _         = require('../localization')._;


/**
 * Wraps <Question /> component and provides toggle switch between
 * readonly/editable modes.
 */
var EditableQuestionWrapper = React.createClass({

  render: function() {
    var question = this.transferPropsTo(
      <Question readOnly={!this.props.active} />
    );
    return (
      <div className="rex-forms-EditableQuestionWrapper">
        {question}
        {this.renderToolbar()}
      </div>
    );
  },

  renderToolbar: function() {
    if (this.props.calculated || this.props.disabled) {
      return <div className="rex-forms-EditableQuestionWrapper__toolbar" />;
    } else {
      return (
        <div className="rex-forms-EditableQuestionWrapper__toolbar">
          <button
            disabled={this.props.active && !this.props.isValid}
            onClick={this.props.active ? this.onSave : this.onEdit}
            className="rex-forms-EditableQuestionWrapper__button">
            {this.props.active ? _('Save') : _('Edit')}
          </button>
          {this.props.active && <button
            onClick={this.onCancel}
            className="rex-forms-EditableQuestionWrapper__button">
            {_('Cancel')}
          </button>}
        </div>
      );
    }
  },

  onEdit: function() {
    this.props.onEdit(this.props.name);
  },

  onSave: function() {
    this.props.onSave(this.props.name);
  },

  onCancel: function() {
    this.props.onCancel(this.props.name);
  }
});

module.exports = EditableQuestionWrapper;
