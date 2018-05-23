/**
 * @copyright 20156 Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import * as stylesheet from '../../stylesheet';
import {VBox} from '../../layout';
import {rgb} from '../../css';

/**
 * Progress bar component.
 */
export default class ProgressBar extends React.Component {

  static propTypes = {
    /**
     * Number in range from 0 to 1 which represents the current value of
     * progress (0 means nothing and 1 means completed).
     */
    progress: PropTypes.number,

    /**
     * CSS style.
     */
    style: PropTypes.object,
  };

  static defaultProps = {
    progress: 0
  };

  static stylesheet = stylesheet.create({
    Root: {
      Component: VBox,
      height: 2,
      background: rgb(142, 142, 226),
    }
  });

  render() {
    let {progress = 0, style, ...props} = this.props;
    let {Root} = this.constructor.stylesheet;
    return (
      <Root
        {...props}
        width={`${progress * 100}%`}
        />
    );
  }
}
