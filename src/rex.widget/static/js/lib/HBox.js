/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React  = require('react');
var Box    = require('./Box');

var HBox = React.createClass({

  render() {
    return <Box {...this.props} direction="horizontal" />;
  }
});

module.exports = HBox;
