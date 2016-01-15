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

  background: CSS.rgb(210, 77, 77),
  backgroundHover: CSS.rgb(173, 48, 48),
  backgroundFocus: CSS.rgb(173, 48, 48),
  backgroundActive: CSS.rgb(173, 48, 48),
  backgroundDisabled: CSS.rgb(226, 135, 135),

  border: CSS.rgb(210, 77, 77),
  borderHover: CSS.rgb(173, 48, 48),
  borderFocus: CSS.rgb(173, 48, 48),
  borderActive: CSS.rgb(173, 48, 48),
  borderDisabled: CSS.rgb(226, 135, 135),

  shadow: CSS.rgb(142, 31, 31),
  shadowFocus: CSS.rgb(70, 21, 20),
  shadowHover: CSS.rgb(70, 21, 20),
  shadowActive: CSS.rgb(70, 21, 20),
});

