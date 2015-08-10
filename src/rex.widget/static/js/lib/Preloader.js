/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import LoadingIndicator   from './LoadingIndicator';
import Style              from './Preloader.module.css';

/**
 * Preloader.
 *
 * Render loading indicator with an optional caption.
 *
 * @public
 */
export default class Preloader extends React.Component {

  static propTypes = {

    /**
     * Caption.
     */
    caption: PropTypes.string,

    /**
     * Extra CSS class name.
     */
    className: PropTypes.string

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
