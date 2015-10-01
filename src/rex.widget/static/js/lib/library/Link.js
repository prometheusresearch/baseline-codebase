/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import React, {PropTypes} from 'react';
import BaseLink           from '../Link';
import populateParams     from './populateParams';

/**
 * Renders a <BaseLink> from ../Link - even though it does not exist.
 * please explain
 */
export default class Link extends React.Component {

  static propTypes = {
    /**
     * The link text.
     */
    text: PropTypes.string,

    /**
     * Link query string parameters.
     */
    params: PropTypes.object,

    /**
     * This object is used for parameter substitution of link params.
     */
    context: PropTypes.object
  }

  render() {
    let {params, text, context, ...props} = this.props;
    params = populateParams(params || {}, context);
    if (params === null) {
      return null;
    }
    return <BaseLink {...props} params={params}>{text}</BaseLink>;
  }
}
