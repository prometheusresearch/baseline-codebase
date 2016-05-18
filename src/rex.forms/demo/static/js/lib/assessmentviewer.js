/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');


var AssessmentViewer = React.createClass({
  propTypes: {
    assessment: React.PropTypes.object.isRequired,
    isValid: React.PropTypes.bool.isRequired
  },

  render: function () {
    var classes = 'rfd-AssessmentViewer';
    if (!this.props.isValid) {
      classes += ' rfd-AssessmentViewer--invalid';
    }

    return (
      <div className={classes}>
        <p>
          {JSON.stringify(this.props.assessment, null, 2)}
        </p>
      </div>
    );
  }
});


module.exports = AssessmentViewer;

