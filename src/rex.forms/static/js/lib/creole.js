/**
 * @jsx React.DOM
 */
'use strict';

var React          = require('react');
var JSCreole       = require('jscreole');
var removeChildren = require('./removeChildren');

var parser = new JSCreole();

var creole = React.createClass({

  propTypes: {
    children: React.PropTypes.string.isRequired,
    component: React.PropTypes.component,
    inline: React.PropTypes.bool
  },

  render: function() {
    var component = this.props.component;
    return this.transferPropsTo(<component />);
  },

  getDefaultProps: function() {
    return {component: React.DOM.span};
  },

  update: function() {
    var node = this.getDOMNode();
    removeChildren(node);
    var text = this.props.children;
    parser.parse(node, text, {inline: this.props.inline});
  },

  componentDidMount: function() {
    this.update();
  },

  componentDidUpdate: function() {
    this.update();
  },

  shouldComponentUpdate: function(nextProps) {
    var shouldUpdate = (
      this.props.inline !== nextProps.inline
      || this.props.children !== nextProps.children
    );
    return shouldUpdate;
  }
});

module.exports = creole;
