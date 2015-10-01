/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Box from './Box';

/**
 * Vertical box component.
 *
 * Renders a <Box> with direction="vertical".
 * Takes the same parameters as <Box>.
 *
 * @public
 */
export default class VBox extends Box {
  static defaultProps = {
    ...Box.defaultProps,
    direction: 'vertical'
  };
}
