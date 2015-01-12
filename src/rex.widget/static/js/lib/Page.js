/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var Element = require('./layout/Element');

var Page = React.createClass({

  render() {
    return (
      <Element {...this.props} title={undefined}>
        {this.props.children}
      </Element>
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
