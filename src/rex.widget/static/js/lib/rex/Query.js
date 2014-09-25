/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Query = React.createClass({

  render() {
    var {data: {data}} = this.props;
    return <div>{JSON.stringify(data)}</div>;
  }
});

module.exports = Query;
