/**
 * @flow
 */

import * as React from 'react';
import findHTMLElement from '../findHTMLElement';
import specialAssign from './specialAssign';

const IGNORE_PROPS = {
  children: true,
  tag: true,
  text: true,
  value: true,
};

export default class MenuItem extends React.Component {
  props: {
    children?: React.Element<*>,
    tag: Function | string,
    text?: string,
    value?: string,
  };

  node: ?HTMLElement;

  static defaultProps = {tag: 'div'};

  static contextTypes = {
    ambManager: React.PropTypes.object.isRequired,
  };

  componentDidMount() {
    this.context.ambManager.addItem({
      node: this.node,
      text: this.props.text,
    });
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.selectItem(event);
  };

  selectItem = (event: KeyboardEvent) => {
    // If there's no value, we'll send the child
    let value = typeof this.props.value !== 'undefined'
      ? this.props.value
      : this.props.children;
    this.context.ambManager.handleSelection(value, event);
  };

  registerNode = (node: ?HTMLElement) => {
    this.node = node ? findHTMLElement(node) : null;
  };

  render() {
    let props = this.props;

    let menuItemProps = {
      onClick: this.selectItem,
      onKeyDown: this.handleKeyDown,
      role: 'menuitem',
      tabIndex: '-1',
      ref: this.registerNode,
    };

    specialAssign(menuItemProps, props, IGNORE_PROPS);

    return React.createElement(props.tag, menuItemProps, props.children);
  }
}
