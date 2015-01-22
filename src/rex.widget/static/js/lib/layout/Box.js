/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var PropTypes       = React.PropTypes;
var cx              = React.addons.classSet;
var cloneWithProps  = React.addons.cloneWithProps;
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

/**
 * Make <Box /> style from props.
 */
function makeBoxStyle(props) {
  props = props || {};
  var {
    direction, size, margin,
    width, height, aligned,
    centerHorizontally, centerVertically,
    scrollable
  } = props;
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
  if (centerHorizontally) {
    style.alignItems = 'center';
  }
  if (centerVertically) {
    style.justifyContent = 'center';
  }
  if (aligned === 'right') {
    style.marginLeft = 'auto';
  }
  if (aligned === 'left') {
    style.alignSelf = 'flex-start';
  }
  if (aligned === 'scrollable') {
    style.overflow = 'auto';
  }
  return style;
}

var Box = React.createClass({

  render() {
    var {
      direction, size, margin, width, height, aligned,
      centerHorizontally, centerVertically, scrollable,
      children, childrenMargin, style: extraStyle,
      Component, ...props
    } = this.props;
    var style = makeBoxStyle({
      direction, size, margin, aligned,
      width, height,
      centerHorizontally, centerVertically,
      scrollable
    });
    if (extraStyle !== undefined) {
      mergeInto(style, extraStyle);
    }
    if (childrenMargin !== undefined) {
      childrenMargin = direction === 'horizontal' ?
        `0px 0px 0px ${childrenMargin}px` :
        `${childrenMargin}px 0px 0px 0px`;
      children = React.Children.map(children, (child, idx) =>
        idx === 0 ?
          child :
          cloneWithProps(child, {margin: childrenMargin}));
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
module.exports.makeBoxStyle = makeBoxStyle;
