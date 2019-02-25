/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Button from './Button';
import * as css from '../../css';
import * as stylesheet from '../../stylesheet';

export default stylesheet.style(Button, {
  raised: true,

  textWidth: 400,

  text: css.rgb(255),
  textHover: css.rgb(255),
  textFocus: css.rgb(255),
  textActive: css.rgb(255),
  textDisabled: css.rgb(255),

  background: css.rgb(210, 77, 77),
  backgroundHover: css.rgb(173, 48, 48),
  backgroundFocus: css.rgb(173, 48, 48),
  backgroundActive: css.rgb(173, 48, 48),
  backgroundDisabled: css.rgb(226, 135, 135),

  border: css.rgb(210, 77, 77),
  borderHover: css.rgb(173, 48, 48),
  borderFocus: css.rgb(173, 48, 48),
  borderActive: css.rgb(173, 48, 48),
  borderDisabled: css.rgb(226, 135, 135),

  shadow: css.rgb(142, 31, 31),
  shadowFocus: css.rgb(70, 21, 20),
  shadowHover: css.rgb(70, 21, 20),
  shadowActive: css.rgb(70, 21, 20),
}, {displayName: 'DangerButton'});
