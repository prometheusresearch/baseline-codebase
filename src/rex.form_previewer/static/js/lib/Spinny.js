/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';


var React = require('react');
var Spinner = require('spin.js');


var Spinny = React.createClass({
  propTypes: {
    options: React.PropTypes.object
  },

  getDefaultProps: function () {
    return {
      options: {}
    };
  },

  componentDidMount: function () {
    new Spinner(this.props.options).spin(this.getDOMNode());
  },

  render: function () {
    return (
      <div
        className="spinner-container"
        />
    );
  }
});


module.exports = Spinny;

