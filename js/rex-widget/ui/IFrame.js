/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as css from "rex-ui/css";
import * as qs from "../qs";

type Props = {
  /**
   * URL to use for the <iframe /> element.
   */
  src: string,

  /**
   * Encodes the URL query string parameters
   * (flattened and appended to the ``src`` property after '?').
   */
  params?: Object,

  /**
   * css border.
   */
  border?: string,

  /**
   * css frameborder.
   */
  frameBorder?: string,

  /**
   * css height.
   */
  height?: string,

  /**
   * css width.
   */
  width?: string,

  /**
   * Extra CSS class name.
   */
  className: string
};

/**
 * Render an iframe.
 *
 * @public
 */
export default class IFrame extends React.Component<Props> {
  static defaultProps = {
    border: "0",
    frameBorder: "0",
    height: "100%",
    width: "100%"
  };

  render() {
    let { src, params, className, ...props } = this.props;
    let style = {
      position: css.position.absolute,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      border: css.none
    };
    if (params) {
      src = src + "?" + qs.stringify(params);
    }
    return <iframe {...props} style={style} src={src} />;
  }
}
