/**
 * @jsx React.DOM
 */
'use strict';

var React      = require('react/addons');
var PropTypes  = React.PropTypes;
var cx         = React.addons.classSet;
var Draggable  = require('react-grid/lib/Draggable');
var Block      = require('./Block');

var ResizeableBlock = React.createClass({

  propTypes: {
    minSize: PropTypes.number,
    direction: PropTypes.string
  },

  render() {
    var direction = this.props.direction;
    var className = cx(
      'rex-widget-ResizeableBlock',
      `rex-widget-ResizeableBlock--${this.props.direction}`,
      this.state.resize && 'rex-widget-ResizeableBlock--resize'
    );
    var forceWidth = direction === 'left' || direction === 'right' ? this.state.size : null;
    var forceHeight = direction === 'top' || direction === 'bottom' ? this.state.size : null;
    return this.transferPropsTo(
      <Block className={className} forceWidth={forceWidth} forceHeight={forceHeight}>
        {this.props.children}
        <Draggable
          className="rex-widget-ResizeableBlock__handle"
          onDrag={this.onResize}
          onDragEnd={this.onResizeEnd}
          />
      </Block>
    );
  },

  getInitialState() {
    return {
      size: null,
      resize: false
    };
  },

  getDefaultProps() {
    return {
      direction: 'left',
      minSize: 0
    };
  },

  size(bounds, x, y) {
    switch (this.props.direction) {
      case 'top':
        return bounds.bottom - y;
      case 'bottom':
        return y - bounds.top;
      case 'left':
        return bounds.right - x;
      case 'right':
        return x - bounds.left;
    }
  },

  onResize(e) {
    this.__bounds = this.__bounds || this.getDOMNode().getBoundingClientRect();
    var size = Math.max(this.size(this.__bounds, e.pageX, e.pageY), this.props.minSize);
    this.setState({size, resize: true});

    var synEvent = new Event('resize');
    window.dispatchEvent(synEvent);
  },

  onResizeEnd(e) {
    this.__bounds = this.__bounds || this.getDOMNode().getBoundingClientRect();
    var size = Math.max(this.size(this.__bounds, e.pageX, e.pageY), this.props.minSize);
    this.__bounds = undefined;
    this.setState({size, resize: false});
  }

});

module.exports = ResizeableBlock;
