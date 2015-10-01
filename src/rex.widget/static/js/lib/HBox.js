/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Box from './Box';

/**
 * Horizontal box component.
 *
 * Renders a <Box> with direction="horizontal".
 * Takes the same parameters as <Box>.
 *
 * @public
 */
export default class HBox extends Box {
  static defaultProps = {
    ...Box.defaultProps,
    direction: 'horizontal'
  };
}
