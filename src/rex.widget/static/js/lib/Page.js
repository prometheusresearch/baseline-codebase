/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var {Box} = require('./layout');

var Page = React.createClass({

  render() {
    return (
      <Box {...this.props} title={undefined}>
        {this.props.children}
      </Box>
    );
  },

  componentDidMount() {
    document.title = this.props.title;
  },

  getDefaultProps() {
    return {size: 1};
  }
});

module.exports = Page;
