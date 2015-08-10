/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Style              from './ProgressBar.module.css';

export default class ProgressBar extends React.Component {

  static propTypes = {
    /**
     * Number in range from 0 to 1 which represents the current value of
     * progress (0 means nothing and 1 means completed).
     */
    progress: PropTypes.number
  };

  static defaultProps = {
    progress: 0
  };

  render() {
    let {progress = 0, style, ...props} = this.props;
    return (
      <Box
        {...props}
        className={Style.self}
        style={{...style, width: `${progress * 100}%`}}
        />
    );
  }
}
