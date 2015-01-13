/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var cx              = React.addons.classSet;
var PropTypes       = React.PropTypes;
var mergeInto       = require('../mergeInto');

var defaultStyle = {
  boxSizing: 'border-box',
  position: 'relative',

  margin: 0,
  padding: 0,

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  flexShrink: 0
};

var Box = React.createClass({

  render() {
    var {
      children, direction, style: extraStyle,
      centerHorizontally, centerVertically,
      width, height, size, margin, Component, ...props
    } = this.props;

    var style = {};
    mergeInto(style, defaultStyle);
    if (direction === 'horizontal') {
      style.flexDirection = 'row';
    }
    if (width !== undefined) {
      style.width = width;
    }
    if (height !== undefined) {
      style.height = height;
    }
    if (size !== undefined) {
      style.flex = size;
    }
    if (margin !== undefined) {
      style.margin = margin;
    }
    if (extraStyle !== undefined) {
      mergeInto(style, extraStyle);
    }
    if (centerHorizontally) {
      style.alignItems = 'center';
    }
    if (centerVertically) {
      style.justifyContent = 'center';
    }
    return (
      <Component {...props} style={style}>
        {children}
      </Component>
    );
  },

  getDefaultProps() {
    return {Component: 'div'};
  }
});

module.exports = Box;

