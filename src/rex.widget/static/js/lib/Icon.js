/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var PropTypes = React.PropTypes;

var Icon = React.createClass({

  propTypes: {
    name: PropTypes.string.isRequired
  },

  render() {
    return <i className={`glyphicon glyphicon-${this.props.name}`} />;
  }
});

module.exports = Icon;
