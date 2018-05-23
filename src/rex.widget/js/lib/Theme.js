/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

const {decode} = require('./Transitionable');

declare var __REX_WIDGET_THEME__: ?string;

export type ButtonStateTheme = {
  textColor?: string,
  backgroundColor?: string,
  borderColor?: string,
};

export type ButtonTheme = {
  hover: ButtonStateTheme,
  focus: ButtonStateTheme,
  active: ButtonStateTheme,
  disabled: ButtonStateTheme,
};

export type FormTheme = {
  verticalFieldSpacing?: number,
  horizontalFieldSpacing?: number,
  condensedLayout?: boolean,
};

export type Theme = {
  button: ButtonTheme,
  form: FormTheme,
};

let __THEME: Theme = (null: any);

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
    },
    form: {},
  };
}

window.__REX_WIDGET_THEME_DEBUG__ = __THEME;
module.exports = __THEME;
