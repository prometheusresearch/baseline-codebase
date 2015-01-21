/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react');
var cx              = React.addons.classSet;
var ReactForms      = require('react-forms');
var ItemLabel       = require('./ItemLabel');
var FormEventsMixin = require('./../form/FormEventsMixin');
var utils           = require('../utils');

/**
 * Row renders inputs for each questions of matrix.
 *
 * @private
 */
var matrixRow = React.createClass({
  mixins: [
    ReactForms.FieldsetMixin,
    FormEventsMixin
  ],

  render: function() {
    var className = cx({
      'rex-forms-matrixRow': true,
      'rex-forms-matrixRow__required': this.value().schema.props.required
    });

    return (
      <div className={className}>
        <ItemLabel
          className="rex-forms-matrixRow__cell rex-forms-matrixRow__label"
          label={this.props.row.text}
          help={this.props.row.help}
          audio={this.props.row.audio}
          hideHelp={this.props.readOnly}
          />
        {this.renderCells()}
      </div>
    );
  },

  renderCells: function() {
    // prevent circular import
    var Question = require('../elements').Question;
    var style = {width: `${100 / (this.props.questions.length + 1)}%`};

    var events = this.formEvents();
    var localValue = this.value();

    return this.props.questions.map((question, idx) => {
      var disabled = this.props.disabled ||
        events.isDisabled(question.fieldId, localValue);
      var hidden = events.isHidden(question.fieldId, localValue);

      return (
        <div key={idx} style={style} className="rex-forms-matrixRow__cell">
          <Question
            readOnly={this.props.readOnly}
            ref={question.fieldId}
            key={question.fieldId}
            name={question.fieldId}
            options={question}
            disabled={disabled}
            hidden={hidden}
            onNext={this.onNext}
            widgetProps={{
              noLabel: true,
              noHelp: true,
              onDirty: this.props.onDirty,
              dirty: this.props.dirty
            }}
            />
        </div>
      );
    });
  },

  getDefaultProps: function() {
    return {
      onNext: utils.emptyFunction
    };
  },

  onNext: function(name) {
    var next = utils.findAfter(this.props.questions, (q) => q.fieldId, name);
    if (next) {
      this.refs[next].focus();
    } else {
      this.props.onNext(this.props.row.id);
    }
  },

  focus: function() {
    if (this.props.questions.length > 0) {
      var fieldId = this.props.questions[0].fieldId;
      this.refs[fieldId].focus();
    }
  }
});

module.exports = matrixRow;
