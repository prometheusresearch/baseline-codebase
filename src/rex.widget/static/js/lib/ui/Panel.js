/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {VBox} from '../../layout';
import * as css from '../../css';
import {style} from '../../stylesheet';

export default style(VBox, {
  background: 'white',
  boxShadow: css.boxShadow(0, 1, 0, 0, '#dddddd'),
  border: css.border(1, '#e2e2e2'),
});
