/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React, {Component} from 'react';

import type {I18NContext} from './I18N';

import * as I18N from './I18N';
import {style} from 'react-dom-stylesheet';
import * as css from 'react-dom-stylesheet/css';

let stylesheet = {
  Root: style('button', {
    display: css.display.inlineBlock,
    verticalAlign: 'bottom',
    cursor: css.cursor.pointer,
    textAlign: css.textAlign.left,
    userSelect: css.none,
    WebkitUserSelect: css.none,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  }),
  Caption: style('div', {
    display: css.display.inlineBlock,
  }),
  Icon: 'span',
  IconWrapper: style('div', {
    display: css.display.inlineBlock,
  }),
};

type ButtonBaseProps = {

  /**
    * If button should be rendered as being pressed.
    */
  active?: boolean;

  /**
    * If button should be rendered in disabled state.
    */
  disabled?: boolean;

  width?: number | string;
  height?: number | string;
  textAlign?: typeof css.textAlign;

  attach?: {left?: boolean; right?: boolean; top?: boolean; bottom?: boolean};

  groupVertically?: boolean;
  groupHorizontally?: boolean;

  /**
    * Button size.
    */
  size?: 'x-small' | 'small' | 'normal' | 'large';

  /**
    * Button's icon.
    */
  icon?: string | React.Element<*>;

  /**
    * Button's alternative icon (placed at the opposite direction to the
    * label).
    */
  iconAlt?: string | React.Element<*>;

  /**
    * Button's alternative icon (placed at the opposite direction to the
    * label).
    *
    * Deprecated.
    */
  iconRight?: string | React.Element<*>;

  href?: String;

  stylesheet: typeof stylesheet;

  variant?: Object;

  style?: Object;

  Component?: string | Function;

  children?: React.Element<*>;
};

type ButtonBasePropsDefault = {
  stylesheet: typeof stylesheet;
};

/**
 * Button component.
 *
 * Button is clickable element with optional icon and/or caption.
 */
export default class ButtonBase extends Component<ButtonBasePropsDefault, ButtonBaseProps, *> {

  context: I18NContext;

  static contextTypes = I18N.contextTypes;

  static defaultProps = {
    stylesheet,
  };

  render() {
    let {
      children, icon, iconAlt = this.props.iconRight,
      disabled, active,
      size = 'normal',
      attach = {},
      href,
      Component,
      groupVertically, groupHorizontally,
      variant,
      stylesheet: {Root, Caption, Icon, IconWrapper},
      textAlign, width, height,
      style,
      ...props
    } = this.props;
    let {i18n = I18N.defaultContext} = this.context;
    let sizeVariant = {
      'x-small': size === 'x-small',
      small: size === 'small',
      normal: size === 'normal',
      large: size === 'large',
    };
    variant = {
      active, disabled,
      attachLeft: attach.left,
      attachRight: attach.right,
      attachTop: attach.top,
      attachBottom: attach.bottom,
      groupVertically,
      groupHorizontally,
      rtl: i18n.dir === 'rtl',
      ltr: i18n.dir === 'ltr',
      ...sizeVariant,
      ...variant,
    };
    style = {
      width, height,
      textAlign,
      ...style,
    };
    if (href != null && Component == null) {
      Component = 'a';
    }
    if (typeof icon === 'string') {
      icon = <Icon name={icon} />;
    }
    if (typeof iconAlt === 'string') {
      iconAlt = <Icon name={iconAlt} />;
    }
    let caption = null;
    if (children) {
      caption = <Caption>{children}</Caption>;
    }
    let hasCaption = !!children;
    return (
      <Root
        Component={Component}
        {...props}
        href={href}
        disabled={disabled}
        variant={variant}
        style={style}
        aria-pressed={active}
        role="button">
        {icon ?
          <IconWrapper variant={{
            ...sizeVariant, hasCaption, leftPosition: true,
            rtl: i18n.dir === 'rtl',
            ltr: i18n.dir === 'ltr',
          }}>
            {icon}
          </IconWrapper> :
          null}
        {caption}
        {iconAlt ?
          <IconWrapper variant={{
            ...sizeVariant, hasCaption, rightPosition: true,
            rtl: i18n.dir === 'rtl',
            ltr: i18n.dir === 'ltr',
          }}>
            {iconAlt}
          </IconWrapper> :
          null}
      </Root>
    );
  }
}

