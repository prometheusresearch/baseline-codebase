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

/**
 * Make <Box /> style from props.
 */
function makeBoxStyle(props) {
  props = props || {};
  var {
    direction, size, margin,
    width, height, aligned,
    centerHorizontally, centerVertically
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
  return style;
}

var Box = React.createClass({

  render() {
    var {
      direction, size, margin, width, height, aligned,
      centerHorizontally, centerVertically,
      children, style: extraStyle,
      Component, ...props
    } = this.props;
    var style = makeBoxStyle({
      direction, size, margin, aligned,
      width, height,
      centerHorizontally, centerVertically
    });
    if (extraStyle !== undefined) {
      mergeInto(style, extraStyle);
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
