/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Button from './Button';
import * as CSS from '../CSS';

export default Button.style({
  textWidth: 300,

  text: CSS.rgb(136),
  textHover: CSS.rgb(68),
  textFocus: CSS.rgb(68),
  textActive: CSS.rgb(255),
  textDisabled: '#dadada',

  background: CSS.rgb(255),
  backgroundHover: CSS.rgb(241),
  backgroundFocus: CSS.rgb(255),
  backgroundActive: CSS.rgb(150),
  backgroundDisabled: CSS.rgb(255),

  border: CSS.color.transparent,
  borderHover: CSS.color.transparent,
  borderFocus: CSS.rgb(241),
  borderActive: CSS.rgb(150),
  borderDisabled: CSS.color.transparent,

  shadowFocus: CSS.none,
  shadowActive: CSS.none,
});
