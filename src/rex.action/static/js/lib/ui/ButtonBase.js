/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import ReactStylesheet from '@prometheusresearch/react-stylesheet';
import Icon from 'rex-widget/lib/Icon';
import isString from 'rex-widget/lib/isString';
import * as Style from 'rex-widget/lib/StyleUtils';
import * as Theme from './Theme';

/**
 * Button component.
 *
 * Button is clickable element with optional icon and/or caption.
 */
@ReactStylesheet
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

  static stylesheet = {
    Root: {
      Component: 'button',
      cursor: Style.cursor.pointer,
      textAlign: Style.textAlign.left,
      fontSize: Theme.fontSize.element,
      fontWeight: Style.fontWeight.bold,
      userSelect: Style.none,
      WebkitUserSelect: Style.none,
    },
    Caption: {
      Component: 'div',
      display: Style.display.inlineBlock,
    },
    Icon: Icon,
  };

  render() {
    let {Root, Caption, Icon} = this.stylesheet;
    let {children, icon, active, size, ...props} = this.props;
    let state = {
      active,
      small: size === 'small',
      normal: size === 'normal',
      large: size === 'large',
    };
    if (isString(icon)) {
      icon = <Icon name={icon} state={{hasCaption: !!children}} />;
    }
    let caption;
    if (children) {
      caption = <Caption>{children}</Caption>;
    }
    return (
      <Root {...props} state={state} aria-pressed={active} role="button">
        {icon}
        {caption}
      </Root>
    );
  }
}
