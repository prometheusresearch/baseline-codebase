/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

export const contextTypes = {
  toolbar: React.PropTypes.any
};

export default class ActionContext extends React.Component {

  static childContextTypes = contextTypes;

  getChildContext() {
    return {toolbar: this.props.toolbar};
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
