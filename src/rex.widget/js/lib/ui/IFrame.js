/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import * as Stylesheet from '../../stylesheet';
import * as css from '../../css';
import * as qs from '../qs';

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

  static stylesheet = Stylesheet.create({
    Root: {
      Component: 'iframe',
      position: css.position.absolute,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      border: css.none,
    }
  });

  render() {
    let {src, params, className, ...props} = this.props;
    if (params) {
      src = src + '?' + qs.stringify(params);
    }
    return (
      <this.constructor.stylesheet.Root
        {...props}
        src={src}
        />
    );
  }

}
