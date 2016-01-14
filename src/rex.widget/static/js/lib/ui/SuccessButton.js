/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Button from './Button';
import * as CSS from '../CSS';

export default Button.style({
  raised: true,

  textWidth: 400,

  text: CSS.rgb(255),
  textHover: CSS.rgb(255),
  textFocus: CSS.rgb(255),
  textActive: CSS.rgb(255),
  textDisabled: CSS.rgb(255),

  background: CSS.rgb(102, 208, 96),
  backgroundHover: CSS.rgb(80, 181, 74),
  backgroundFocus: CSS.rgb(80, 181, 74),
  backgroundActive: CSS.rgb(80, 181, 74),
  backgroundDisabled: CSS.rgb(162, 232, 158),

  border: CSS.rgb(70, 171, 65),
  borderHover: CSS.rgb(61, 152, 56),
  borderFocus: CSS.rgb(61, 152, 56),
  borderActive: CSS.rgb(61, 152, 56),
  borderDisabled: CSS.rgb(162, 232, 158),

  shadow: CSS.rgb(56, 134, 51),
  shadowFocus: CSS.rgb(49, 128, 45),
  shadowHover: CSS.rgb(49, 128, 45),
  shadowActive: CSS.rgb(49, 128, 45),
});
