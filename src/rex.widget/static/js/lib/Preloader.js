/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import LoadingIndicator   from './LoadingIndicator';
import Style              from './Preloader.module.css';

/**
 * Renders a <div> with a <LoadingIndicator> and a caption.
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
