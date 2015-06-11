/**
 * @copyright 2015, Facebook, Inc. All rights reserved.
 */
'use strict';

var React         = require('react');
var isTouchDevice = require('./Environment').isTouchDevice;

var TouchableArea = React.createClass({
  getDefaultProps() {
    return {
      touchable: true,
      element: 'div'
    };
  },

  handleTouchStart(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchStart(e.touches, e.timeStamp);
  },

  handleTouchMove(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
    e.preventDefault();
  },

  handleTouchEnd(e) {
    if (!this.props.scroller || !this.props.touchable) {
      return;
    }

    this.props.scroller.doTouchEnd(e.timeStamp);
  },

  render() {
    var {element: Element, children, ...props} = this.props;
    if (isTouchDevice) {
      return (
        <Element
          {...props}
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouchMove}
          onTouchEnd={this.handleTouchEnd}
          onTouchCancel={this.handleTouchEnd}>
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
});

module.exports = TouchableArea;
