/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Button from './Button';
import {css, style} from './stylesheet';

export default style(Button, {
  textWidth: 300,

  text: css.rgb(136),
  textHover: css.rgb(68),
  textFocus: css.rgb(68),
  textActive: css.rgb(255),
  textDisabled: '#dadada',

  background: css.rgb(255),
  backgroundHover: css.rgb(241),
  backgroundFocus: css.rgb(255),
  backgroundActive: css.rgb(150),
  backgroundDisabled: css.rgb(255),

  border: css.color.transparent,
  borderHover: css.color.transparent,
  borderFocus: css.rgb(241),
  borderActive: css.rgb(150),
  borderDisabled: css.color.transparent,

  shadowFocus: css.none,
  shadowActive: css.none,
}, {displayName: 'QuietButton'});
