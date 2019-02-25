/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import {chooseValue} from './Utils';
import * as theme from './theme';
import type {I18NContext} from './I18N';
import * as I18N from './I18N';

type Size = number | string;

type Props = {
  Component?: string | Function,
  inline?: boolean,
  noWrap?: boolean,
  position?: 'relative' | 'absolute' | 'fixed',
  width?: Size,
  maxWidth?: Size,
  minWidth?: Size,
  height?: Size,
  maxHeight?: Size,
  minHeight?: Size,
  top?: Size,
  left?: Size,
  bottom?: Size,
  right?: Size,
  positionStart?: Size,
  positionEnd?: Size,
  padding?: Size,
  paddingV?: Size,
  paddingH?: Size,
  paddingStart?: Size,
  paddingEnd?: Size,
  paddingLeft?: Size,
  paddingRight?: Size,
  paddingTop?: Size,
  paddingBottom?: Size,
  margin?: Size,
  marginV?: Size,
  marginH?: Size,
  marginStart?: Size,
  marginEnd?: Size,
  marginLeft?: Size,
  marginRight?: Size,
  marginTop?: Size,
  marginBottom?: Size,
  float?: 'left' | 'right' | 'start' | 'end',
  textAlign?: 'left' | 'right' | 'center' | 'start' | 'end',
  verticalAlign?: string,
  style?: Object,
};

type Context = {
  i18n: I18NContext,
};

export default function Block(
  {
    Component,
    inline,
    noWrap,
    position = 'relative',
    width,
    maxWidth,
    minWidth,
    height,
    maxHeight,
    minHeight,
    positionStart,
    positionEnd,
    top,
    left,
    bottom,
    right,
    padding,
    paddingV,
    paddingH,
    paddingStart,
    paddingEnd,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    margin,
    marginV,
    marginH,
    marginStart,
    marginEnd,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    float,
    textAlign,
    verticalAlign,
    style,
    ...props
  }: Props,
  {i18n = I18N.defaultContext}: Context,
) {
  if (Component == null) {
    Component = 'div';
  }

  if (paddingStart !== undefined) {
    if (i18n.dir === 'rtl' && paddingRight === undefined) {
      paddingRight = paddingStart;
    } else if (i18n.dir === 'ltr' && paddingLeft === undefined) {
      paddingLeft = paddingStart;
    }
  }

  if (paddingEnd !== undefined) {
    if (i18n.dir === 'rtl' && paddingLeft === undefined) {
      paddingLeft = paddingEnd;
    } else if (i18n.dir === 'ltr' && paddingRight === undefined) {
      paddingRight = paddingEnd;
    }
  }

  if (marginStart !== undefined) {
    if (i18n.dir === 'rtl' && marginRight === undefined) {
      marginRight = marginStart;
    } else if (i18n.dir === 'ltr' && marginLeft === undefined) {
      marginLeft = marginStart;
    }
  }

  if (marginEnd !== undefined) {
    if (i18n.dir === 'rtl' && marginLeft === undefined) {
      marginLeft = marginEnd;
    } else if (i18n.dir === 'ltr' && marginRight === undefined) {
      marginRight = marginEnd;
    }
  }

  if (positionStart !== undefined) {
    if (i18n.dir === 'rtl' && right === undefined) {
      right = positionStart;
    } else if (i18n.dir === 'ltr' && left === undefined) {
      left = positionStart;
    }
  }

  if (positionEnd !== undefined) {
    if (i18n.dir === 'rtl' && left === undefined) {
      left = positionEnd;
    } else if (i18n.dir === 'ltr' && right === undefined) {
      right = positionEnd;
    }
  }

  if (float === 'start') {
    float = i18n.dir === 'rtl' ? 'right' : 'left';
  } else if (float === 'end') {
    float = i18n.dir === 'rtl' ? 'left' : 'right';
  }

  if (textAlign === 'start') {
    textAlign = i18n.dir === 'rtl' ? 'right' : 'left';
  } else if (textAlign === 'end') {
    textAlign = i18n.dir === 'rtl' ? 'left' : 'right';
  }

  style = {
    paddingLeft: chooseValue(theme.padding, paddingLeft, paddingH, padding),
    paddingRight: chooseValue(theme.padding, paddingRight, paddingH, padding),
    paddingTop: chooseValue(theme.padding, paddingTop, paddingV, padding),
    paddingBottom: chooseValue(theme.padding, paddingBottom, paddingV, padding),
    marginLeft: chooseValue(theme.margin, marginLeft, marginH, margin),
    marginRight: chooseValue(theme.margin, marginRight, marginH, margin),
    marginTop: chooseValue(theme.margin, marginTop, marginV, margin),
    marginBottom: chooseValue(theme.margin, marginBottom, marginV, margin),
    display: inline ? 'inline-block' : undefined,
    whiteSpace: noWrap ? 'nowrap' : undefined,
    position,
    width,
    minWidth,
    maxWidth,
    height,
    minHeight,
    maxHeight,
    top,
    left,
    bottom,
    right,
    float,
    textAlign,
    verticalAlign,
    ...style,
  };
  return <Component {...props} style={style} />;
}

Block.contextTypes = I18N.contextTypes;
