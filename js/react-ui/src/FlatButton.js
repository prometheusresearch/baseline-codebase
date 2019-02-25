/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {css} from 'react-stylesheet';
import * as ButtonStylesheet from './ButtonStylesheet';
import ButtonBase from './ButtonBase';

export default class FlatButton extends ButtonBase {
  static stylesheet = ButtonStylesheet.create({
    raised: true,

    textWidth: 300,

    text: css.rgb(160),
    textHover: css.rgb(130),
    textFocus: css.rgb(130),
    textActive: css.rgb(150),
    textDisabled: '#dadada',

    background: css.rgb(255),
    backgroundHover: css.rgb(241),
    backgroundFocus: css.rgb(255),
    backgroundActive: css.rgb(231),
    backgroundDisabled: css.rgb(251),

    border: css.rgb(180),
    borderHover: css.rgb(180),
    borderFocus: css.rgb(180),
    borderActive: css.rgb(180),
    borderDisabled: css.rgb(180),

    shadow: css.none,
    shadowHover: css.none,
    shadowFocus: css.none,
    shadowActive: css.rgb(210),
  });
}
