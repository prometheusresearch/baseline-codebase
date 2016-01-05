/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {VBox} from '@prometheusresearch/react-box';
import * as CSS from 'react-stylesheet/css';

export default VBox.style({
  background: 'white',
  boxShadow: CSS.boxShadow(0, 1, 0, 0, '#dddddd'),
  border: CSS.border(1, '#e2e2e2'),
});
