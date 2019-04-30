/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as qs from "./qs";
import resolveURL from "./resolveURL";

type Props = {|
  /**
   * Link URL.
   *
   * This could be specified as Rex resource specification (pkg:/path).
   */
  href: string,

  /**
   * (optional) querystring parameters.
   * If provided, this object will be "flattened" into a string
   * which is prepended with '?' and then appended to the href url.
   */
  params?: Object
|};

/**
 * Renders an anchor <a>
 *
 * @public
 */
export function Link(props: Props) {
  let { href, params, ...rest } = props;
  href = resolveURL(href);
  if (params) {
    href = `${href}?${qs.stringify(params)}`;
  }
  return <a {...rest} href={href} />;
}
