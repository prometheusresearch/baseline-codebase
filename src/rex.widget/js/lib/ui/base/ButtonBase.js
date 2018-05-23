/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';

import * as Stylesheet from '../../../stylesheet';
import * as CSS from '../../../css';
import {isString} from '../../lang';
import Icon from '../Icon';

/**
 * Button component.
 *
 * Button is clickable element with optional icon and/or caption.
 */
export default class ButtonBase extends React.Component {

  static propTypes = {
    /**
     * If button should be rendered as being pressed.
     */
    active: PropTypes.bool,

    /**
     * Button size.
     */
    size: PropTypes.oneOf(['small', 'normal', 'large']),

    /**
     * Button's icon.
     */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Button's caption.
     */
    children: PropTypes.node,
  };

  static defaultProps = {
    size: 'normal',
    attach: {},
  };

  static stylesheet = Stylesheet.create({
    Root: {
      Component: 'button',
      cursor: CSS.cursor.pointer,
      textAlign: CSS.textAlign.left,
      userSelect: CSS.none,
      WebkitUserSelect: CSS.none,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    Caption: {
      Component: 'div',
      display: CSS.display.inlineBlock,
    },
    Icon: Icon,
    IconWrapper: {
      Component: 'div',
      display: CSS.display.inlineBlock,
    },
  });

  render() {
    let {Root, Caption, Icon, IconWrapper} = this.constructor.stylesheet;
    let {
      children, icon,
      disabled, active, size,
      attach,
      variant,
      ...props
    } = this.props;
    variant = {
      active, disabled,
      attachLeft: attach.left,
      attachRight: attach.right,
      attachTop: attach.top,
      attachBottom: attach.bottom,
      small: size === 'small',
      normal: size === 'normal',
      large: size === 'large',
      ...variant,
    };
    if (isString(icon)) {
      icon = <Icon name={icon} />;
    }
    let caption = null;
    if (children) {
      caption = <Caption>{children}</Caption>;
    }
    return (
      <Root
        {...props}
        disabled={disabled}
        variant={variant}
        aria-pressed={active}
        role="button">
        {icon ?
          <IconWrapper variant={{hasCaption: !!children}}>
            {icon}
          </IconWrapper> :
          null}
        {caption}
      </Root>
    );
  }
}

