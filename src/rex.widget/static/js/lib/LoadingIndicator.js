/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                from 'react';
import loadingIndicatorImg  from '../img/loading-indicator.gif';
import Style                from './LoadingIndicator.module.css';

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
export default class LoadingIndicator extends React.Component {

  render() {
    return (
      <div className={Style.self}>
        <img src={__PUBLIC_PATH__ + loadingIndicatorImg} />
      </div>
    );
  }

  shouldComponentUpdate() {
    return false;
  }
}
