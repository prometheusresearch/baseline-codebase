/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as qs from './qs';
import resolveURL from './resolveURL';

/**
 * Renders an anchor <a>
 *
 * @public
 */
export default class Link extends React.Component {

  static propTypes = {

    /**
     * Link URL.
     *
     * This could be specified as Rex resource specification (pkg:/path).
     */
    href: React.PropTypes.string.isRequired,

    /**
     * (optional) querystring parameters.
     * If provided, this object will be "flattened" into a string
     * which is prepended with '?' and then appended to the href url.
     */
    params: React.PropTypes.object
  };

  render() {
    let {href, params, ...props} = this.props;
    href = resolveURL(href);
    if (params) {
      href = `${href}?${qs.stringify(params)}`;
    }
    return <a {...props} href={href} />;
  }
}
