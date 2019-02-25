/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');


var InstrumentTile = React.createClass({
  propTypes: {
    instrument: React.PropTypes.object.isRequired
  },

  render: function () {
    var classes = classNames({
      'rfb-instrument-tile': true,
      'disabled': this.props.instrument.status === 'disabled'
    });

    return (
      <div
        onClick={this.props.onClick}
        className={classes}>
        <h2>{this.props.instrument.title}</h2>
      </div>
    );
  }
});


module.exports = InstrumentTile;

