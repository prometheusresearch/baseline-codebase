/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {
  create as createImpl,
  style as styleImpl,
  override as overrideImpl
} from 'react-stylesheet-old';

import {
  style as styleHostComponent,
  wrapWithStylesheet
} from 'react-dom-stylesheet';

import color from 'color-js';

import * as css from 'react-dom-stylesheet/css';
import * as component from 'react-dom-stylesheet/component';

export function style(Component, spec, options) {
  return styleImpl(Component, spec, {styleHostComponent, ...options});
}

export function create(spec, options) {
  return createImpl(spec, {styleHostComponent, ...options});
}

export function override(stylesheet, override, options) {
  return overrideImpl(stylesheet, override, {style, styleHostComponent, ...options});
}

export {
  css,
  color,
  component,
  wrapWithStylesheet
};
