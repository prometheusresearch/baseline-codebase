/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Stylesheet         from '@prometheusresearch/react-stylesheet';
import cx                 from 'classnames';
import * as qs            from './qs';
import Style              from './StyleUtils';

/**
 * Render an iframe.
 *
 * @public
 */
@Stylesheet
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

  static stylesheet = {
    Root: {
      position: Style.position.absolute,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      border: Style.none,
    }
  };

  render() {
    let {src, params, className, ...props} = this.props;
    if (params) {
      src = src + '?' + qs.stringify(params);
    }
    return (
      <this.stylesheet.Root
        {...props}
        src={src}
        className={cx(Style.self, className)}
        />
    );
  }

}
