/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React            from 'react';
import cx               from 'classnames';
import LoadingIndicator from './LoadingIndicator';
import Style            from './Preloader.module.css';

export default class Preloader extends React.Component {

  static defaultProps = {
    caption: null
  };

  render() {
    let {caption, className} = this.props;
    return (
      <div className={cx(Style.self, className)}>
        <LoadingIndicator />
        {caption && <div className={Style.caption}>{caption}</div>}
      </div>
    );
  }

}
