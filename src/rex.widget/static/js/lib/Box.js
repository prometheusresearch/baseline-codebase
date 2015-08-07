/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import autoprefix         from './autoprefixStyle';
import Style              from './Box.module.css';

/**
 * Make <Box /> style from props.
 */
export function makeBoxStyle(props) {
  props = props || {};
  var {
    direction, size, margin, padding,
    width, height, aligned,
    centerHorizontally, centerVertically,
    scrollable, backgroundColor
  } = props;
  var style = {...style};
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
    style.flexGrow = size;
  }
  if (margin !== undefined) {
    style.margin = margin;
  }
  if (padding !== undefined) {
    style.padding = padding;
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
  if (scrollable) {
    style.overflow = 'auto';
  }
  if (backgroundColor !== undefined) {
    style.backgroundColor = backgroundColor;
  }
  return style;
}

const ALIGNED = {
  RIGHT: 'right',
  LEFT: 'left',
};

const DIRECTION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
};

export default class Box extends React.Component {

  static propTypes = {
    Component: PropTypes.oneOfType([PropTypes.string, PropTypes.component]),
    direction: PropTypes.oneOf([DIRECTION.HORIZONTAL, DIRECTION.VERTICAL]),
    size: PropTypes.number,
    padding: PropTypes.number,
    height: PropTypes.number,
    aligned: PropTypes.oneOf([ALIGNED.LEFT, ALIGNED.RIGHT]),
    centerHorizontally: PropTypes.bool,
    centerVertically: PropTypes.bool,
    scrollable: PropTypes.bool,
    childrenMargin: PropTypes.number,
    backgroundColor: PropTypes.string
  };

  static defaultProps = {
    Component: 'div',
    direction: DIRECTION.VERTICAL,
  };

  render() {
    let {
      direction, size, margin, padding, width, height, aligned,
      centerHorizontally, centerVertically, scrollable,
      children, childrenMargin,
      style: extraStyle, className: extraClassName,
      backgroundColor, Component, ...props
    } = this.props;
    let style = makeBoxStyle({
      direction, size, margin, padding, aligned,
      width, height,
      centerHorizontally, centerVertically,
      scrollable, backgroundColor
    });
    let className = cx(extraClassName, {
      [Style.VBox]: direction === DIRECTION.VERTICAL,
      [Style.HBox]: direction === DIRECTION.HORIZONTAL,
    });
    if (extraStyle !== undefined) {
      style = {...style, ...extraStyle};
    }
    if (childrenMargin !== undefined) {
      childrenMargin = direction === 'horizontal' ?
        `0px 0px 0px ${childrenMargin}px` :
        `${childrenMargin}px 0px 0px 0px`;
      children = React.Children.map(children, (child, idx) =>
        idx === 0 || !child ?
          child :
          React.cloneElement(child, {margin: childrenMargin}));
    }
    return (
      <Component {...props} className={className} style={autoprefix(style)}>
        {children}
      </Component>
    );
  }
}
