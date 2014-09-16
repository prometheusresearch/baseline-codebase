/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var PropTypes       = React.PropTypes;
var cx              = React.addons.classSet;
var cloneWithProps  = React.addons.cloneWithProps;
var merge           = require('../merge');

var Container = React.createClass({

  propTypes: {
    vertical: PropTypes.bool
  },

  render() {
    var style = {
      flexDirection: this.props.vertical ? 'column' : 'row',
      WebkitFlexDirection: this.props.vertical ? 'column' : 'row'
    };
    return (
      <div style={style} className={cx('rex-widget-Container', this.props.className)}>
        {this.renderChildren(this.props.children)}
      </div>
    );
  },

  renderChildren(children) {
    return React.Children.map(children, (child) => {
      if (child === null) {
        return child;
      }
      return cloneWithProps(child, merge(
        {vertical: this.props.vertical},
        this.props.vertical ? {width: '100%'} : {height: '100%'}
      ));
    });
  }
});

module.exports = Container;
