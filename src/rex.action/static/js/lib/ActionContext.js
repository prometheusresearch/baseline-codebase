/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

export const contextTypes = {
  toolbar: React.PropTypes.any,
  help: React.PropTypes.string,
};

export default class ActionContext extends React.Component {

  static childContextTypes = contextTypes;

  getChildContext() {
    return {
      toolbar: this.props.toolbar,
      help: this.props.help,
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}
