/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var PropTypes       = React.PropTypes;
var cx              = React.addons.classSet;
var Draggable       = require('react-grid/lib/Draggable');
var Block           = require('./Block');
var merge           = require('../merge');
var PageStateMixin  = require('../PageStateMixin');

var ResizeableBlock = React.createClass({

  mixins: [PageStateMixin],

  propTypes: {
    minSize: PropTypes.number,
    direction: PropTypes.string
  },

  render() {
    var direction = this.props.direction;
    var className = cx(
      'rw-ResizeableBlock',
      `rw-ResizeableBlock--${this.props.direction}`,
      this.state.resize && 'rw-ResizeableBlock--resize'
    );
    return this.transferPropsTo(
      <Block className={className} fixedSize={this.state.size}>
        {this.props.children}
        <div className="rw-ResizeableBlock__service">
          <Draggable
            title="Drag to resize"
            className="rw-ResizeableBlock__handle"
            onDrag={this.onResize}
            onDragEnd={this.onResizeEnd}
            />
          {this.props.service}
        </div>
      </Block>
    );
  },

  getInitialState() {
    return merge({
      resize: false,
      size: null
    }, this.getPageState());
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
    this.setPageState({size});
  }

});

module.exports = ResizeableBlock;
