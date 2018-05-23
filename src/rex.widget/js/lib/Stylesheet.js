/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {
  create as createImpl,
  style as styleImpl,
  override as overrideImpl
} from 'react-stylesheet';
import {
  style as styleHostComponent
} from 'react-dom-stylesheet';

export let styleDOM = styleHostComponent;

export function style(Component, spec, options) {
  options = {styleHostComponent, ...options};
  return styleImpl(Component, spec, options);
}

export function create(spec, options) {
  options = {style, styleHostComponent, ...options};
  return createImpl(spec, options);
}

export function override(stylesheet, override, options) {
  options = {style, styleHostComponent, ...options};
  return overrideImpl(stylesheet, override, options);
}
