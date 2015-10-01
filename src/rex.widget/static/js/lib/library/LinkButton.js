/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Button             from '../Button';
import populateParams     from './populateParams';

/**
 * Renders a <Button>
 *
 * The ``params`` are populated from the ``context``.
 * and the `text` is passed as a child and is the text of the link.
 *
 * @public
 * @deprecated
 */
export default class LinkButton extends React.Component {

  static propTypes = {
    /**
     * href attribute contains the url to link to.
     */
    href: PropTypes.string.isRequired,

    /**
     * This object is populated from the context and represents the query string
     * which will be appended to the href url.
     *
     * See static/js/lib/library/populateParams.js
     */
    params: PropTypes.object,

    /**
     * This object is used for parameter substitution of link params.
     */
    context: PropTypes.object,

    /**
     * The text of the link.
     */
    text: PropTypes.string
  };

  static defaultProps = {
    quiet: true,
    align: 'left'
  };

  render() {
    let {href, params, context, text, ...props} = this.props;
    params = populateParams(params || {}, context);
    return (
      <Button
        {...this.props}
        href={href}
        params={params}>
        {text}
      </Button>
    );
  }
}
