/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes}               from 'react';
import * as Stylesheet                  from '../../stylesheet';
import {padding, fontWeight, textAlign} from '../../css';
import LoadingIndicator                 from './LoadingIndicator';

/**
 * Preloader component with loading indicator and optional caption.
 *
 * @public
 */
export default class Preloader extends React.Component {

  static propTypes = {
    /**
     * The text of the caption.
     */
    caption: PropTypes.string,

    /**
     * The name of the css class to include for the <div>.
     */
    className: PropTypes.string
  };

  static stylesheet = Stylesheet.create({
    Root: {
      width: '100%',
      height: '100%',
      color: '#aaa',
      fontWeight: fontWeight.bold,
      textAlign: textAlign.center,
      padding: padding(6, 12),
    },
    Caption: {
      padding: padding(6, 12),
    },
    LoadingIndicator,
  });

  render() {
    let {caption, ...props} = this.props;
    let {Root, Caption, LoadingIndicator} = this.constructor.stylesheet;
    return (
      <Root {...props}>
        <LoadingIndicator />
        {caption && <Caption>{caption}</Caption>}
      </Root>
    );
  }

}
