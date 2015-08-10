/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import qs                 from './qs';
import Style              from './IFrame.module.css';

/**
 * Render an iframe.
 *
 * @public
 */
export default class IFrame extends React.Component {

  static propTypes = {

    /**
     * URL to use for <iframe /> element.
     */
    src: PropTypes.string.isRequired,

    /**
     * URL parameters (added to ``src`` prop).
     */
    params: PropTypes.object,

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
