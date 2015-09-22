/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {VBox}             from 'rex-widget/lib/Layout';

export default class ActionSidebar extends React.Component {

  static propTypes = {
    action: PropTypes.string.isRequired
  };

  render() {
    let {action} = this.props;
    return <VBox id={`${action}__sidebar`} />;
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.action !== this.props.action;
  }
}
