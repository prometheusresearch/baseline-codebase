/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import {chooseValue} from './Utils';
import * as theme from './theme';
import {HBox as HBoxBase} from '@prometheusresearch/react-box';

export default function HBox({
  padding,
  paddingV, paddingH,
  paddingLeft, paddingRight, paddingTop, paddingBottom,
  margin,
  marginV, marginH,
  marginLeft, marginRight, marginTop, marginBottom,
  style,
  ...props
}) {
  style = {
    paddingLeft: chooseValue(theme.padding, paddingLeft, paddingH, padding),
    paddingRight: chooseValue(theme.padding, paddingRight, paddingH, padding),
    paddingTop: chooseValue(theme.padding, paddingTop, paddingV, padding),
    paddingBottom: chooseValue(theme.padding, paddingBottom, paddingV, padding),
    marginLeft: chooseValue(theme.margin, marginLeft, marginH, margin),
    marginRight: chooseValue(theme.margin, marginRight, marginH, margin),
    marginTop: chooseValue(theme.margin, marginTop, marginV, margin),
    marginBottom: chooseValue(theme.margin, marginBottom, marginV, margin),
    ...style,
  };
  return <HBoxBase {...props} style={style} />;
}
