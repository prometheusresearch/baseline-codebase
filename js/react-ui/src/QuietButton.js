/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import {css} from 'react-stylesheet';
import * as ButtonStylesheet from './ButtonStylesheet';
import ButtonBase from './ButtonBase';

export default class QuietButton extends ButtonBase {
  static stylesheet = ButtonStylesheet.create({
    raised: false,

    textWidth: 300,

    text: css.rgb(136),
    textHover: css.rgb(68),
    textFocus: css.rgb(68),
    textActive: css.rgb(31, 133, 245),
    textDisabled: '#dadada',

    background: css.rgb(255),
    backgroundHover: css.rgb(255),
    backgroundFocus: css.rgb(255),
    backgroundActive: css.rgb(255),
    backgroundDisabled: css.rgb(255),

    border: css.color.transparent,
    borderHover: css.color.transparent,
    borderFocus: css.rgb(241),
    borderActive: css.color.transparent,

    shadowFocus: css.none,
    shadowActive: css.none,
  });
}
