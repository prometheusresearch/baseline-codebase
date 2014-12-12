/**
 * Sortable repeating fieldset.
 *
 * @jsx React.DOM
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React            = require('react/addons');
var cx              = React.addons.classSet;
var SetIntervalMixin = require('./SetIntervalMixin');

var ContextTypes = {
  syntheticScroller: React.PropTypes.object
};

var SyntheticScroller = React.createClass({
  mixins: [SetIntervalMixin],

  propTypes: {
    scrollOnDragDelta: React.PropTypes.number,
    scrollOnDragInterval: React.PropTypes.number,
    scrollOnDragThreshold: React.PropTypes.number,
    children: React.PropTypes.element,
    active: React.PropTypes.bool.isRequired
  },

  contextTypes: ContextTypes,
  childContextTypes: ContextTypes,

  render() {
    var {component: Component, className, children, ...props} = this.props;
    children = React.Children.only(children);
    children = React.addons.cloneWithProps(children, {ref: 'underlying'});
    return (
      <Component {...props}
        className={cx("rfb-ScrollOnDrag", className)}
        onMouseMove={this.props.active && this.onMouseMove}>
        {children}
      </Component>
    );
  },

  getDefaultProps() {
    return {
      component: 'div',
      scrollOnDragDelta: 30,
      scrollOnDragInterval: 100,
      scrollOnDragThreshold: 50
    };
  },

  getChildContext() {
    return {
      syntheticScroller: {
        onMouseMove: this.onMouseMove,
        clearInterval: this.clearInterval
      }
    };
  },

  componentWillReceiveProps({active}) {
    if (!active) {
      if (this.context.syntheticScroller) {
        this.context.syntheticScroller.clearInterval();
      }
      this.clearInterval();
    }
  },

  getUnderlying() {
    return this.refs.underlying;
  },

  onMouseMove(e) {
    if (this.context.syntheticScroller) {
      this.context.syntheticScroller.onMouseMove(e);
      return;
    }
    var {
      scrollOnDragThreshold,
      scrollOnDragDelta,
      scrollOnDragInterval
    } = this.props;
    var node = this.getDOMNode();
    var box = node.getBoundingClientRect();
    // check if we want to scroll to top
    if (e.pageY - box.top < scrollOnDragThreshold) {
      if (!this.isIntervalSet() && node.scrollTop > 0) {
        this.setInterval(() => {
          // TODO: make scrollOnDragDelta dependent on the scrollOnDragThreshold
          node.scrollTop = node.scrollTop - scrollOnDragDelta
        }, scrollOnDragInterval);
      }
    // check if we want to scroll to bottom
    } else if (box.bottom - e.pageY < scrollOnDragThreshold) {
      var contentHeight = node.firstChild.getBoundingClientRect().height;
      if (!this.isIntervalSet() && contentHeight > node.scrollTop + box.height) {
        this.setInterval(() => {
          // TODO: make scrollOnDragDelta dependent on the scrollOnDragThreshold
          node.scrollTop = node.scrollTop + scrollOnDragDelta
        }, scrollOnDragInterval);
      }
    // cancel any scroll
    } else {
      this.clearInterval();
    }
  }
});

module.exports = SyntheticScroller;
