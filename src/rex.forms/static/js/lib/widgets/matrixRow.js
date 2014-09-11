/**
 * @jsx React.DOM
 */
'use strict';

var React      = require('react');
var cx         = React.addons.classSet;
var ReactForms = require('react-forms');
var ItemLabel  = require('./ItemLabel');

/**
 * Row renders inputs for each questions of matrix.
 *
 * @private
 */
var matrixRow = React.createClass({
  mixins: [ReactForms.FieldsetMixin],

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
    return this.props.questions.map((question, idx) =>
      <div key={idx} style={style} className="rex-forms-matrixRow__cell">
        <Question 
          readOnly={this.props.readOnly}
          key={question.fieldId}
          name={question.fieldId}
          options={question}
          widgetProps={{
            noLabel: true,
            noHelp: true,
            onDirty: this.props.onDirty,
            dirty: this.props.dirty
          }}
          />
      </div>
    );
  }
});

module.exports = matrixRow;
