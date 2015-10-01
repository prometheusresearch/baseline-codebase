/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                from 'react';
import Stylesheet           from '@prometheusresearch/react-stylesheet';
import loadingIndicatorImg  from '../img/loading-indicator.gif';
import {textAlign}          from './StyleUtils';

/**
 * Loading indicator component.
 *
 * This widget renders a <div> which contains an <img>
 * of the loading indicator.  There are no parameters.
 *
 * ``../img/loading-indicator.gif`` contains the loading indicator.
 *
 * A widget can choose to render this widget while its data is loading.
 */
@Stylesheet
export default class LoadingIndicator extends React.Component {

  static stylesheet = {
    Root: {
      width: '100%',
      textAlign: textAlign.center,
    }
  };

  render() {
    let {Root} = this.stylesheet;
    return (
      <Root>
        <img src={__PUBLIC_PATH__ + loadingIndicatorImg} />
      </Root>
    );
  }

  shouldComponentUpdate() {
    return false;
  }
}
