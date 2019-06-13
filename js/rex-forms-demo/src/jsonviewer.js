/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import * as PropTypes from 'prop-types';

export default class JsonViewer extends React.Component {

  static propTypes = {
    object: PropTypes.object.isRequired,
  };

  render() {
    let {object} = this.props;
    return (
      <div>
        <pre>
          {JSON.stringify(object, null, 2)}
        </pre>
      </div>
    );
  }
}
