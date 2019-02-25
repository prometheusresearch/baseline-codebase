/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type {fontSize, fontWeight} from 'react-stylesheet/lib/CSSType';

import * as React from 'react';

import * as theme from './theme';
import {chooseValue} from './Utils';

type Props = {
  fontSize?: fontSize,
  fontWeight?: fontWeight,
  color?: string,
  style?: Object,
};

export default function Text(
  {
    fontSize,
    fontWeight,
    color,
    style,
    ...props
  }: Props,
) {
  style = {
    fontSize: chooseValue(theme.fontSize, fontSize),
    fontWeight: fontWeight,
    color,
    ...style,
  };
  return <span {...props} style={style} />;
}
