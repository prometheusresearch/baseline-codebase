/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import * as qs            from './qs';
import Style              from './IFrame.module.css';

/**
 * Render an iframe.
 *
 * @public
 */
export default class IFrame extends React.Component {

  static propTypes = {

    /**
     * URL to use for the <iframe /> element.
     */
    src: PropTypes.string.isRequired,

    /**
     * Encodes the URL query string parameters
     * (flattened and appended to the ``src`` property after '?').
     */
    params: PropTypes.object,

    /**
     * css border.
     */
    border: PropTypes.string,

    /**
     * css frameborder.
     */
    frameBorder: PropTypes.string,

    /**
     * css height.
     */
    height: PropTypes.string,

    /**
     * css width.
     */
    width: PropTypes.string,

    /**
     * Extra CSS class name.
     */
    className: PropTypes.string
  };

  static defaultProps = {
    border: '0',
    frameBorder: '0',
    height: '100%',
    width: '100%'
  };

  render() {
    let {src, params, className, ...props} = this.props;
    if (params) {
      src = src + '?' + qs.stringify(params);
    }
    return (
      <iframe
        {...props}
        src={src}
        className={cx(Style.self, className)}
        />
    );
  }

}
