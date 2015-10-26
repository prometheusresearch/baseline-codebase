/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Icon               from 'rex-widget/lib/Icon';

function getIconAtPosition(position) {
  if (position.element == null) {
    return null;
  }
  let {type: Component, props} = position.element;
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
    position: PropTypes.object.isRequired
  };

  static getIconAtPosition = getIconAtPosition;

  render() {
    let {position, ...props} = this.props;
    let name = getIconAtPosition(position);
    return name ? <Icon {...props} name={name} /> : null;
  }
}
