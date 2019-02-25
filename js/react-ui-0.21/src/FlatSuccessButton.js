/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {style, css} from './stylesheet';
import Button from './Button';

export default style(Button, {
  raised: true,

  textWidth: 300,

  text: css.rgb(18, 134, 12),
  textHover: css.rgb(18, 134, 12),
  textFocus: css.rgb(18, 134, 12),
  textActive: css.rgb(18, 134, 12),
  textDisabled: css.rgb(136, 189, 133),

  background: css.rgb(255),
  backgroundHover: css.rgb(246, 253, 247),
  backgroundFocus: css.rgb(255),
  backgroundActive: css.rgb(236, 245, 236),
  backgroundDisabled: css.rgb(255),

  border: css.rgb(18, 134, 12),
  borderHover: css.rgb(18, 134, 12),
  borderFocus: css.rgb(18, 134, 12),
  borderActive: css.rgb(18, 134, 12),
  borderDisabled: css.rgb(18, 134, 12),

  shadow: css.none,
  shadowHover: css.none,
  shadowFocus: css.none,
  shadowActive: css.rgb(90, 155, 86),
  shadowDisabled: css.none,
}, 'FlatSuccessButton');
