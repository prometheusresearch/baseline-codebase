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

/**
 * Basic rectangular widget.
 *
 * @public
 */
export default class Box extends React.Component {

  static propTypes = {
    /**
     * The html component which contains the children.  
     */
    Component: PropTypes.oneOfType([PropTypes.string, PropTypes.component]),

    /**
     * string one of ``'horizontal'``, ``'vertical'``.
     *
     * Selects the layout of the children within this widget.
     */
    direction: PropTypes.oneOf([DIRECTION.HORIZONTAL, DIRECTION.VERTICAL]),

    /**
     * Unitless number representing the amount of space this widget uses
     * relative to all its sibling widgets.
     */
    size: PropTypes.number,
    
    /**
     * The css padding.
     */
    padding: PropTypes.string, //number,
    
    /**
     * The css height
     */
    height: PropTypes.string, //number,

    /**
     * The css alignment.  one of ``'left'``, ``'right'``.
     */
    aligned: PropTypes.oneOf([ALIGNED.LEFT, ALIGNED.RIGHT]),
    
    /**
     * When ``true``, request horizontal centering.
     */
    centerHorizontally: PropTypes.bool,
    
    /**
     * When ``true``, request vertical centering.
     */
    centerVertically: PropTypes.bool,

    /**
     * When ``true``, allow scrolling.
     */
    scrollable: PropTypes.bool,

    /**
     * margin for the children.
     */
    childrenMargin: PropTypes.string, //number,
    
    /**
     * The css background color
     */
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
