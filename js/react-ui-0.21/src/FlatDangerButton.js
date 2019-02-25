/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {style, css} from './stylesheet';
import Button from './Button';

export default style(Button, {
  raised: true,

  textWidth: 300,

  text: css.rgb(210, 77, 77),
  textHover: css.rgb(210, 77, 77),
  textFocus: css.rgb(210, 77, 77),
  textActive: css.rgb(210, 77, 77),
  textDisabled: css.rgb(239, 163, 163),

  background: css.rgb(255),
  backgroundHover: css.rgb(253, 246, 246),
  backgroundFocus: css.rgb(255),
  backgroundActive: css.rgb(253, 245, 245),
  backgroundDisabled: css.rgb(255),

  border: css.rgb(210, 77, 77),
  borderHover: css.rgb(173, 48, 48),
  borderFocus: css.rgb(173, 48, 48),
  borderActive: css.rgb(173, 48, 48),
  borderDisabled: css.rgb(173, 48, 48),

  shadow: css.none,
  shadowHover: css.none,
  shadowFocus: css.none,
  shadowActive: css.rgb(241, 170, 170),
  shadowDisabled: css.none,
}, 'FlatDangerButton');

