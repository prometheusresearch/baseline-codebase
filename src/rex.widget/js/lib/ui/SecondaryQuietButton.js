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
  textDisabled: rgb(210),

  background: rgb(239),
  backgroundHover: rgb(229),
  backgroundFocus: rgb(239),
  backgroundActive: rgb(130),
  backgroundDisabled: rgb(239),

  border: rgb(239),
  borderHover: rgb(229),
  borderFocus: rgb(229),
  borderActive: rgb(130),
  borderDisabled: rgb(239),

  shadow: none,
  shadowHover: none,
  shadowFocus: none,
  shadowActive: none,
  shadowDisabled: none,
});

