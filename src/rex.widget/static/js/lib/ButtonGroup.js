/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

let leftButtonStyle = {
  borderBottomRightRadius: 0,
  borderTopRightRadius: 0,
  borderRight: 'none',
};

let middleButtonStyle = {
  borderRadius: 0,
  borderRight: 'none',
};

let rightButtonStyle = {
  borderBottomLeftRadius: 0,
  borderTopLeftRadius: 0,
};

function styleElement(element, style) {
  style = {...element.props.style, ...style};
  return React.cloneElement(element, {style});
}

export default class ButtonGroup extends React.Component {

  render() {
    let {children} = this.props;
    let childrenLength = React.Children.count(children);
    children = React.Children.map(children, (button, idx) => {
      if (idx === 0) {
        return styleElement(button, leftButtonStyle);
      } else if (idx === childrenLength - 1) {
        return styleElement(button, rightButtonStyle);
      } else {
        return styleElement(button, middleButtonStyle);
      }
    });
    return (
      <div>
        {children}
      </div>
    );
  }
}
