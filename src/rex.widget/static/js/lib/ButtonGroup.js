/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React  from 'react';
import Style  from './ButtonGroup.style';

const leftButtonTheme = {self: Style.leftButton};
const rightButtonTheme = {self: Style.rightButton};
const middleButtonTheme = {self: Style.middleButton};

export default class ButtonGroup extends React.Component {

  static defaultTheme = Style;

  render() {
    let {children} = this.props;
    let childrenLength = React.Children.count(children);
    children = React.Children.map(children, (button, idx) => {
      if (idx === 0) {
        return React.cloneElement(button, {theme: leftButtonTheme});
      } else if (idx === childrenLength - 1) {
        return React.cloneElement(button, {theme: rightButtonTheme});
      } else {
        return React.cloneElement(button, {theme: middleButtonTheme});
      }
    });
    return (
      <div>
        {children}
      </div>
    );
  }
}
