/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var cx        = React.addons.classSet;
var ItemLabel = require('./ItemLabel');

/**
 * Header row renders labels for each question of matrix.
 *
 * @private
 */
var matrixHeaderRow = React.createClass({

  render: function() {
    var cells = this.props.questions.map((question, idx) => {
      var schema = this.props.columns[idx];
      var className = cx({
        'rex-forms-matrixHeaderRow__label': true,
        'rex-forms-matrixHeaderRow__cell': true,
        'rex-forms-matrixHeaderRow__cell--required': !this.props.readOnly
          && schema.children.value.props.required
      });
      return (
        <ItemLabel
          key={idx}
          className={className}
          label={question.text}
          help={question.help}
          audio={question.audio}
          hideHelp={this.props.readOnly}
          />
      );
    });
    return (
      <div className="rex-forms-matrixHeaderRow">
        <div></div>
        {cells}
      </div>
    );
  }
});

module.exports = matrixHeaderRow;
