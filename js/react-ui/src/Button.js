/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {css} from 'react-stylesheet';
import ButtonBase from './ButtonBase';
import * as ButtonStylesheet from './ButtonStylesheet';

export default class Button extends ButtonBase {
  static stylesheet = ButtonStylesheet.create({
    raised: true,

    textWidth: 300,

    text: css.rgb(130),
    textHover: css.rgb(100),
    textFocus: css.rgb(100),
    textActive: css.rgb(140),
    textDisabled: '#dadada',

    background: css.rgb(255),
    backgroundHover: css.rgb(241),
    backgroundFocus: css.rgb(255),
    backgroundActive: css.rgb(231),
    backgroundDisabled: css.rgb(251),

    border: css.rgb(180),
    borderHover: css.rgb(180),
    borderFocus: css.rgb(180),
    borderActive: css.rgb(200),
    borderDisabled: css.rgb(180),

    shadow: '#b7b7b7',
    shadowHover: '#b7b7b7',
    shadowFocus: '#b7b7b7',
    shadowActive: css.rgb(210),
    shadowDisabled: '#ddd',

    shadowFocusRing: css.boxShadow(0, 0, 0, 2, css.rgba(0, 126, 229, 0.5)),
  });
}
