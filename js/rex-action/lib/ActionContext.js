/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @noflow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

export const contextTypes = {
  toolbar: PropTypes.any,
  help: PropTypes.string,
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
