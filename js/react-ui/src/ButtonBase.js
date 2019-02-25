/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React, {Component} from 'react';

import type {I18NContext} from './I18N';

import * as I18N from './I18N';
import {style, css} from 'react-stylesheet';

export let stylesheet = {
  Root: style('button', {
    base: {
      display: 'inline-block',
      verticalAlign: 'bottom',
      textAlign: 'left',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
  }),
  Caption: style('div', {
    base: {
      display: 'inline-block',
    },
  }),
  IconWrapper: style('div', {
    base: {
      display: 'inline-block',
    },
  }),
};

export type ButtonBaseProps = {
  /**
    * If button should be rendered as being pressed.
    */
  active?: boolean,

  /**
    * If button should be rendered in disabled state.
    */
  disabled?: boolean,

  width?: number | string,
  height?: number | string,
  textAlign?: typeof css.textAlign,

  attach?: {left?: boolean, right?: boolean, top?: boolean, bottom?: boolean},

  groupVertically?: boolean,
  groupHorizontally?: boolean,

  /**
    * Button size.
    */
  size?: 'x-small' | 'small' | 'normal' | 'large',

  /**
    * Button's icon.
    */
  icon?: string | React.Element<*>,

  /**
    * Button's alternative icon (placed at the opposite direction to the
    * label).
    */
  iconAlt?: string | React.Element<*>,

  /**
    * Button's alternative icon (placed at the opposite direction to the
    * label).
    *
    * Deprecated.
    */
  iconRight?: string | React.Element<*>,

  href?: String,

  stylesheet: typeof stylesheet,

  variant?: Object,

  style?: Object,

  Component?: string | Function,

  children?: React.Element<*>,
};

/**
 * Button component.
 *
 * Button is clickable element with optional icon and/or caption.
 */
export default class ButtonBase extends Component<*, ButtonBaseProps, *> {
  context: {i18n: I18NContext};

  static stylesheet = stylesheet;

  static contextTypes = I18N.contextTypes;

  render() {
    let {
      children,
      icon,
      iconAlt = this.props.iconRight,
      disabled,
      active,
      size = 'normal',
      attach = {},
      href,
      Component,
      groupVertically,
      groupHorizontally,
      variant,
      stylesheet: {Root, Caption, IconWrapper} = this.constructor.stylesheet,
      textAlign,
      width,
      height,
      style,
      ...props
    } = this.props;

    let {
      i18n = I18N.defaultContext,
    } = this.context;

    let sizeVariant = {
      xSmall: size === 'x-small',
      small: size === 'small',
      normal: size === 'normal',
      large: size === 'large',
    };

    let i18nVariant = {
      rtl: i18n.dir === 'rtl',
      ltr: i18n.dir === 'ltr',
    };

    variant = {
      active,
      disabled,
      attachLeft: attach.left,
      attachRight: attach.right,
      attachTop: attach.top,
      attachBottom: attach.bottom,
      groupVertically,
      groupHorizontally,
      ...i18nVariant,
      ...sizeVariant,
      ...variant,
    };

    style = {
      width,
      height,
      textAlign,
      ...style,
    };

    if (href != null && Component == null) {
      Component = 'a';
    }

    let caption = null;
    if (children) {
      caption = <Caption>{children}</Caption>;
    }

    if (icon) {
      let style = {
        marginRight: children && i18n.dir === 'ltr' ? 4 : 0,
        marginLeft: children && i18n.dir === 'rtl' ? 4 : 0,
      };
      icon = (
        <IconWrapper style={style}>
          {icon}
        </IconWrapper>
      );
    }

    if (iconAlt) {
      let style = {
        marginLeft: children && i18n.dir === 'ltr' ? 4 : 0,
        marginRight: children && i18n.dir === 'rtl' ? 4 : 0,
      };
      iconAlt = (
        <IconWrapper style={style}>
          {iconAlt}
        </IconWrapper>
      );
    }

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
        {icon}
        {caption}
        {iconAlt}
      </Root>
    );
  }
}
