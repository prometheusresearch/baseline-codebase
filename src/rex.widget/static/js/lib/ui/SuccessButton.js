/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Button from './Button';
import * as css from '../../css';
import * as Stylesheet from '../../stylesheet';

export default Stylesheet.style(Button, {
  raised: true,

  textWidth: 400,

  text: css.rgb(255),
  textHover: css.rgb(255),
  textFocus: css.rgb(255),
  textActive: css.rgb(255),
  textDisabled: css.rgb(255),

  background: css.rgb(41, 173, 34),
  backgroundHover: css.rgb(26, 160, 30),
  backgroundFocus: css.rgb(26, 160, 30),
  backgroundActive: css.rgb(26, 160, 30),
  backgroundDisabled: css.rgb(162, 232, 158),

  border: css.rgb(18, 134, 12),
  borderHover: css.rgb(18, 134, 12),
  borderFocus: css.rgb(18, 134, 12),
  borderActive: css.rgb(18, 134, 12),
  borderDisabled: css.rgb(162, 232, 158),

  shadow: css.rgb(56, 134, 51),
  shadowFocus: css.rgb(56, 134, 51),
  shadowHover: css.rgb(56, 134, 51),
  shadowActive: css.rgb(56, 134, 51),
}, {displayName: 'SuccessButton'});
