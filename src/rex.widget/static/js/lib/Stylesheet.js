/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {
  create as createImpl,
  style as styleImpl,
  override as overrideImpl
} from 'react-stylesheet';
import {
  style as styleDOM
} from 'react-dom-stylesheet';

export function style(Component, spec, options) {
  return styleImpl(Component, spec, {styleDOM, ...options});
}

export function create(spec, options) {
  return createImpl(spec, {styleDOM, ...options});
}

export function override(stylesheet, override, options) {
  return overrideImpl(stylesheet, override, {style, styleDOM, ...options});
}
