/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');


var JsonViewer = React.createClass({
  propTypes: {
    object: React.PropTypes.object.isRequired,
    isValid: React.PropTypes.bool.isRequired
  },

  render: function () {
    var classes = 'rfd-JsonViewer';
    if (!this.props.isValid) {
      classes += ' rfd-JsonViewer--invalid';
    }

    return (
      <div className={classes}>
        <p>
          {JSON.stringify(this.props.object, null, 2)}
        </p>
      </div>
    );
  }
});


module.exports = JsonViewer;

