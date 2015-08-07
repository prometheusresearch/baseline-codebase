/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Box from './Box';

export default class HBox extends Box {
  static defaultProps = {
    ...Box.defaultProps,
    direction: 'horizontal'
  };
}
