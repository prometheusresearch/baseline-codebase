/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';

import * as Stylesheet from 'rex-widget/stylesheet';
import * as CSS from 'rex-widget/css';
import {Icon} from 'rex-widget/ui';
import {isString} from 'rex-widget/lang';

import * as Theme from './Theme';

/**
 * Button component.
 *
 * Button is clickable element with optional icon and/or caption.
 */
@Stylesheet.attach
export default class Button extends React.Component {

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
    size: 'normal'
  };

  static stylesheet = Stylesheet.create({
    Root: {
      Component: 'button',
      cursor: CSS.cursor.pointer,
      textAlign: CSS.textAlign.left,
      fontSize: Theme.fontSize.element,
      userSelect: CSS.none,
      WebkitUserSelect: CSS.none,
    },
    Caption: {
      Component: 'div',
      display: CSS.display.inlineBlock,
      maxWidth: '90%',
    },
    Icon: Icon,
    IconWrapper: {
      Component: 'div',
      display: CSS.display.inlineBlock,
    },
  });

  render() {
    let {Root, Caption, Icon, IconWrapper} = this.stylesheet;
    let {children, icon, active, size, ...props} = this.props;
    let variant = {
      active,
      small: size === 'small',
      normal: size === 'normal',
      large: size === 'large',
    };
    if (isString(icon)) {
      icon = <Icon name={icon} variant={{hasCaption: !!children}} />;
    }
    let caption;
    if (children) {
      caption = <Caption>{children}</Caption>;
    }
    return (
      <Root {...props} variant={variant} aria-pressed={active} role="button">
        <IconWrapper>{icon}</IconWrapper>
        {caption}
      </Root>
    );
  }
}
