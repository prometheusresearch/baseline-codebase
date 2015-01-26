/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react');

var Null = React.createClass({

  render() {
    return null;
  },

  shouldComponentUpdate() {
    return false;
  }
});

module.exports = Null;
