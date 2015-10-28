/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import * as Stylesheet    from '@prometheusresearch/react-stylesheet';
import {Box}              from './Layout';
import {rgb}              from './StyleUtils';

/**
 * Progress bar component.
 */
@Stylesheet.styleable
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

  static stylesheet = Stylesheet.createStylesheet({
    Root: {
      Component: Box,
      height: 2,
      background: rgb(142, 142, 226),
    }
  });

  render() {
    let {progress = 0, style, ...props} = this.props;
    let {Root} = this.stylesheet;
    return (
      <Root
        {...props}
        style={{...style, width: `${progress * 100}%`}}
        />
    );
  }
}
