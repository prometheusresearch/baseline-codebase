/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {css} from 'react-stylesheet';
import * as ButtonStylesheet from './ButtonStylesheet';
import ButtonBase from './ButtonBase';
import {brandColors} from './theme';

export default class OptionButton extends ButtonBase {
  static stylesheet = ButtonStylesheet.create({
    raised: false,

    textWidth: 300,

    text: css.rgb(136),
    textHover: brandColors.secondary,
    textFocus: css.rgb(68),
    textActive: brandColors.secondary,
    textDisabled: '#dadada',

    background: css.rgb(255),
    backgroundHover: css.rgb(255),
    backgroundFocus: css.rgb(255),
    backgroundActive: css.rgb(241),
    backgroundDisabled: css.rgb(255),

    border: css.color.transparent,
    borderHover: css.color.transparent,
    borderFocus: css.color.transparent,
    borderActive: css.color.transparent,
    borderDisabled: css.color.transparent,

    shadowFocus: css.none,
    shadowActive: css.none,
  });
}
