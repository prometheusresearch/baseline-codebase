/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';

import * as Stylesheet from '../../Stylesheet';
import * as CSS from '../../CSS';
import isString from '../../isString';
import Icon from '../Icon';

/**
 * Button component.
 *
 * Button is clickable element with optional icon and/or caption.
 */
@Stylesheet.attach
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
    icon: PropTypes.string,

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
    let {Root, Caption, Icon, IconWrapper} = this.stylesheet;
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
      icon = <Icon name={icon} variant={{hasCaption: !!children}} />;
    }
    let caption;
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
        <IconWrapper>{icon}</IconWrapper>
        {caption}
      </Root>
    );
  }
}

