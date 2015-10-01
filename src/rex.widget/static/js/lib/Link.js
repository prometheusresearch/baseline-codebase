/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React      from 'react';
import qs         from './qs';
import resolveURL from './resolveURL';

function interpolateLinkParams(link, name, value) {
  if (!link) {
    return link;
  }
  let {params, href} = link.props;
  let nextParams = {};
  for (let n in params) {
    if (params[n] === `$${name}`) {
      nextParams[n] = value;
    } else {
      nextParams[n] = params[n];
    }
  }
  return React.cloneElement(link, {href, params: nextParams});
}

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
     * the children to display inside the anchor.
     */
    children: React.PropTypes.element,

    /**
     * (optional) querystring parameters.
     * If provided, this object will be "flattened" into a string
     * which is prepended with '?' and then appended to the href url.
     */
    params: React.PropTypes.object
  };

  render() {
    let {href, children, params, ...props} = this.props;
    href = resolveURL(href);
    if (params) {
      href = href + '?' + qs.stringify(params);
    }
    return <a {...props} href={href}>{children}</a>;
  }

  static interpolateLinkParams = interpolateLinkParams;
}
