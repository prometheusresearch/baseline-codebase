/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {Icon} from 'rex-widget/ui';

export function getIconAtNode(node) {
  if (node.element == null) {
    return null;
  }
  let {type: Component, props} = node.element;
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

  static propTypes = {
    node: PropTypes.object.isRequired
  };

  render() {
    let {node, ...props} = this.props;
    let name = getIconAtNode(node);
    return name ? <Icon {...props} name={name} /> : null;
  }
}
