/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Button from './Button';
import {rgb, none} from '../CSS';

export default Button.style({
  raised: true,

  textWidth: 300,

  text: rgb(173),
  textHover: rgb(130),
  textFocus: rgb(154),
  textActive: rgb(173),
  textDisabled: '#dadada',

  background: rgb(255),
  backgroundHover: rgb(241),
  backgroundFocus: rgb(255),
  backgroundActive: rgb(241),
  backgroundDisabled: rgb(255),

  border: rgb(234),
  borderHover: rgb(224),
  borderFocus: rgb(204),
  borderActive: rgb(224),
  borderDisabled: '#ececec',

  shadow: none,
  shadowHover: none,
  shadowFocus: none,
  shadowActive: '#ddd',
  shadowDisabled: none,
});

