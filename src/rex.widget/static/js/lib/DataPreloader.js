/**
 * @jsx React.DOM
 */
'use strict';

var React      = require('react');
var PropTypes  = React.PropTypes;
var Preloader  = require('./Preloader');

var DataPreloader = React.createClass({

  propTypes: {
    data: PropTypes.object.isRequired,
    caption: PropTypes.string,
    children: PropTypes.component,
    renderer: PropTypes.func
  },

  render() {
    var {updating} = this.props.data;
    if (updating) {
      return <Preloader caption={this.props.caption} />;
    } else if (this.props.children) {
      return React.Children.only(this.props.children);
    } else if (this.props.renderer) {
      return this.props.renderer();
    }
  }
});

module.exports = DataPreloader;
