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
  backgroundHover: CSS.rgb(26, 160, 30),
  backgroundFocus: CSS.rgb(26, 160, 30),
  backgroundActive: CSS.rgb(26, 160, 30),
  backgroundDisabled: CSS.rgb(162, 232, 158),

  border: CSS.rgb(18, 134, 12),
  borderHover: CSS.rgb(18, 134, 12),
  borderFocus: CSS.rgb(18, 134, 12),
  borderActive: CSS.rgb(18, 134, 12),
  borderDisabled: CSS.rgb(162, 232, 158),

  shadow: CSS.rgb(56, 134, 51),
  shadowFocus: CSS.rgb(56, 134, 51),
  shadowHover: CSS.rgb(56, 134, 51),
  shadowActive: CSS.rgb(56, 134, 51),
});
