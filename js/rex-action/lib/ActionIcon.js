/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import {Icon} from 'rex-widget/ui';
import type {Position} from './model/types';

export function getIconAtPosition(position: Position) {
  const {element} = position.instruction.action;
  if (element == null) {
    return null;
  }
  let {type: Component, props} = element;
  if (Component.getIcon) {
    return Component.getIcon(props);
  } else if (props.icon) {
    return props.icon;
  } else if (Component.defaultProps && Component.defaultProps.icon) {
    return Component.defaultProps.icon;
  } else if (Component.getDefaultProps) {
    return Component.getDefaultProps().icon;
  } else {
    return null;
  }
}

export default class ActionIcon extends React.Component {
  props: {
    position: Position,
  };

  render() {
    let {position, ...props} = this.props;
    let name = getIconAtPosition(position);
    return name ? <Icon {...props} name={name} /> : null;
  }
}
