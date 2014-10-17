/**
 * Draggable component.
 *
 * Implements just draggable lifecycle (onDragStart, onDrag and onDragEnd
 * callbacks). All DOM manipulations should be implemented by component
 * consumer.
 *
 * @jsx React.DOM
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React         = require('react');
var PropTypes     = React.PropTypes;
var emptyFunction = require('./emptyFunction');

var Draggable = React.createClass({

  propTypes: {
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func,
    onDrag: PropTypes.func,
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.constructor])
  },

  render() {
    var component = this.props.component;
    return this.transferPropsTo(
      <component onMouseDown={this.onMouseDown}>
        {this.props.children}
      </component>
    );
  },

  getDefaultProps() {
    return {
      component: React.DOM.div,
      onDragStart: emptyFunction.thatReturnsTrue,
      onDragEnd: emptyFunction,
      onDrag: emptyFunction
    };
  },

  getInitialState() {
    return {
      drag: null
    };
  },

  onMouseDown(e) {
    var drag = this.props.onDragStart(e);

    if (drag === null || e.button !== 0) {
      return;
    }

    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);

    this.setState({drag});
  },

  onMouseMove(e) {
    if (this.state.drag === null) {
      return;
    }

    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (e.preventDefault) {
      e.preventDefault();
    }

    this.props.onDrag(e, this.state.drag);
  },

  onMouseUp(e) {
    this.cleanUp();
    this.props.onDragEnd(e, this.state.drag);
    this.setState({drag: null});
  },

  componentWillUnmount() {
    this.cleanUp();
  },

  cleanUp() {
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
  }
});

module.exports = Draggable;
