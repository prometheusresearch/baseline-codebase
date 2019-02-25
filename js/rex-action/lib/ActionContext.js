/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';

export const contextTypes = {
  toolbar: React.PropTypes.any,
  help: React.PropTypes.string,
};

export default class ActionContext extends React.Component {

  props: {
    children?: React.Element<*>,
    toolbar: React.Element<*>,
    help: string,
  };

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
