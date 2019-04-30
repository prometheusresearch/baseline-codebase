/**
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';
import createManager from './createManager';
import specialAssign from './specialAssign';

const IGNORE_PROPS = {
  children: true,
  onMenuToggle: true,
  onSelection: true,
  closeOnSelection: true,
  tag: true,
};

export default class Wrapper extends React.Component {
  static defaultProps = {tag: 'div'};

  manager: any;

  static childContextTypes = {
    ambManager: PropTypes.object,
  };

  getChildContext() {
    return {
      ambManager: this.manager,
    };
  }

  componentWillMount() {
    this.manager = createManager({
      onMenuToggle: this.props.onMenuToggle,
      onSelection: this.props.onSelection,
      closeOnSelection: this.props.closeOnSelection,
      id: this.props.id,
    });
  }

  render() {
    let props = this.props;
    let wrapperProps = {};
    specialAssign(wrapperProps, props, IGNORE_PROPS);
    return React.createElement(props.tag, wrapperProps, props.children);
  }
}
