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
  var {params, href} = link.props;
  var nextParams = {};
  for (var n in params) {
    if (params[n] === `$${name}`) {
      nextParams[n] = value;
    } else {
      nextParams[n] = params[n];
    }
  }
  return React.cloneElement(link, {href, params: nextParams});
}

/**
 * Link.
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
     * URL parameters (added to ``href``).
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
