/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';

import * as theme from './theme';
import {wrapWithStylesheet} from './stylesheet';
import {chooseValue} from './Utils';

export default function Text({
  fontSize,
  fontWidth,
  color,
  style,
  ...props
}) {
  style = {
    fontSize: chooseValue(theme.fontSize, fontSize),
    fontWidth,
    color,
    ...style,
  };
  return <span {...props} style={style} />;
}

Text.style = function style(stylesheet) {
  return wrapWithStylesheet(Text, stylesheet, 'Text');
};
