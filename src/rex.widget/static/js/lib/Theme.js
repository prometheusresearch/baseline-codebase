/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {decode} from './Transitionable';

let __THEME = null;

if (typeof __REX_WIDGET_THEME__ !== 'undefined') {
  __THEME = decode(__REX_WIDGET_THEME__);
}

export default __THEME;
