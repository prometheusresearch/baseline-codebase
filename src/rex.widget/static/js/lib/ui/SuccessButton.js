/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Button from './Button';
import * as CSS from '../CSS';

export default Button.style({
  raised: true,

  textWidth: 400,

  text: CSS.rgb(109, 175, 128),
  textHover: CSS.rgb(109, 175, 128),
  textFocus: CSS.rgb(109, 175, 128),
  textActive: CSS.rgb(127, 195, 147),
  textDisabled: CSS.rgb(172, 199, 180),

  background: CSS.rgb(207, 239, 215),
  backgroundHover: CSS.rgb(228, 251, 234),
  backgroundFocus: CSS.rgb(207, 239, 215),
  backgroundActive: CSS.rgb(207, 239, 215),
  backgroundDisabled: CSS.rgb(233, 243, 236),

  border: CSS.rgb(194, 228, 202),
  borderHover: CSS.rgb(194, 228, 202),
  borderFocus: CSS.rgb(194, 228, 202),
  borderActive: CSS.rgb(194, 228, 202),
  borderDisabled: CSS.rgb(233, 243, 236),

  shadow: CSS.rgb(162, 208, 174),
  shadowFocus: CSS.rgb(162, 208, 174),
  shadowHover: CSS.rgb(162, 208, 174),
  shadowActive: CSS.rgb(163, 216, 178),
});
