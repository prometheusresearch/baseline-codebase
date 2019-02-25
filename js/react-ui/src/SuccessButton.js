/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import {css} from 'react-stylesheet';
import * as ButtonStylesheet from './ButtonStylesheet';
import ButtonBase from './ButtonBase';

export default class SuccessButton extends ButtonBase {
  static stylesheet = ButtonStylesheet.create({
    raised: true,

    textWidth: 300,

    text: css.rgb(255),
    textHover: css.rgb(255),
    textFocus: css.rgb(255),
    textActive: css.rgb(255),
    textDisabled: css.rgb(255),

    background: css.rgb(41, 173, 34),
    backgroundHover: css.rgb(26, 160, 30),
    backgroundFocus: css.rgb(41, 173, 34),
    backgroundActive: css.rgb(26, 160, 30),
    backgroundDisabled: css.rgb(162, 232, 158),

    border: css.rgb(18, 134, 12),
    borderHover: css.rgb(18, 134, 12),
    borderFocus: css.rgb(18, 134, 12),
    borderActive: css.rgb(18, 134, 12),
    borderDisabled: css.rgb(162, 232, 158),

    shadow: css.rgb(56, 134, 51),
    shadowFocus: css.rgb(56, 134, 51),
    shadowHover: css.rgb(56, 134, 51),
    shadowActive: css.rgb(56, 134, 51),

    shadowFocusRing: css.boxShadow(0, 0, 0, 2, css.rgba(0, 126, 229, 0.5)),
  });
}
