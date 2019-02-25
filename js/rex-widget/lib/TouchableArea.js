/**
 * @copyright 2015, Facebook, Inc. All rights reserved.
 */

import React, {PropTypes} from 'react';
import {isTouchDevice}    from './Environment';

export default class TouchableArea extends React.Component {

  static propTypes = {
    scroller: PropTypes.object,
    touchable: PropTypes.bool,
    element: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    children: PropTypes.node,
  };

  static defaultProps = {
    touchable: true,
    element: 'div',
  };

  render() {
    let {element: Element, children, ...props} = this.props;
    if (isTouchDevice) {
      return (
        <Element
          {...props}
          onTouchStart={this._onTouchStart}
          onTouchMove={this._onTouchMove}
          onTouchEnd={this._onTouchEnd}
          onTouchCancel={this._onTouchEnd}>
          {children}
        </Element>
      );
    } else {
      return (
        <Element {...props}>
          {children}
        </Element>
      );
    }
  }

  _onTouchStart = (e) => {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchStart(e.touches, e.timeStamp);
  };

  _onTouchMove = (e) => {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
    e.preventDefault();
  };

  _onTouchEnd = (e) => {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchEnd(e.timeStamp);
  };

}
