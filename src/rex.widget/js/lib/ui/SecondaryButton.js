/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Button from './Button';
import {rgb, none} from '../CSS';

export default Button.style({
  raised: false,

  textWidth: 400,

  text: rgb(160),
  textHover: rgb(130),
  textFocus: rgb(130),
  textActive: rgb(220),
  textDisabled: rgb(200),

  background: '#efefef',
  backgroundHover: rgb(241),
  backgroundFocus: rgb(241),
  backgroundActive: rgb(130),
  backgroundDisabled: rgb(241),

  border: rgb(208),
  borderHover: rgb(180),
  borderFocus: rgb(180),
  borderActive: rgb(130),
  borderDisabled: rgb(220),

  shadow: none,
  shadowHover: none,
  shadowFocus: none,
  shadowActive: none,
  shadowDisabled: none,
});
