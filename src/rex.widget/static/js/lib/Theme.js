/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {decode} from './Transitionable';

let __THEME = null;

if (typeof __REX_WIDGET_THEME__ !== 'undefined') {
  /* istanbul ignore next */
  __THEME = decode(__REX_WIDGET_THEME__);
} else {
  __THEME = {
    button: {
      hover: {},
      focus: {},
      active: {},
      disabled: {},
    }
  };
}

module.exports = __THEME;
