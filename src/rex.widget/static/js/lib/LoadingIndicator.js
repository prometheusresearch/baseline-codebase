/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                from 'react';
import loadingIndicatorImg  from '../img/loading-indicator.gif';
import Style                from './LoadingIndicator.module.css';

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
