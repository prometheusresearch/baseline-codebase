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

  background: CSS.rgb(41, 173, 34),
  backgroundHover: CSS.rgb(22, 142, 16),
  backgroundFocus: CSS.rgb(22, 142, 16),
  backgroundActive: CSS.rgb(22, 142, 16),
  backgroundDisabled: CSS.rgb(162, 232, 158),

  border: CSS.rgb(70, 171, 65),
  borderHover: CSS.rgb(22, 142, 16),
  borderFocus: CSS.rgb(22, 142, 16),
  borderActive: CSS.rgb(22, 142, 16),
  borderDisabled: CSS.rgb(162, 232, 158),

  shadow: CSS.rgb(56, 134, 51),
  shadowFocus: CSS.rgb(25, 80, 22),
  shadowHover: CSS.rgb(25, 80, 22),
  shadowActive: CSS.rgb(25, 80, 22),
});
