/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var PropTypes       = React.PropTypes;
var cx              = React.addons.classSet;
var cloneWithProps  = React.addons.cloneWithProps;

var Container = React.createClass({

  propTypes: {
    vertical: PropTypes.bool
  },

  render() {
    var style = {
      flexDirection: this.props.vertical ? 'column' : 'row'
    };
    return (
      <div style={style} className={cx('rex-widget-Container', this.props.className)}>
        {this.renderChildren(this.props.children)}
      </div>
    );
  },

  renderChildren(children) {
    return React.Children.map(children, (child) => {
      var props = this.props.vertical ? {width: '100%'} : {height: '100%'};
      return cloneWithProps(child, props);
    });
  }
});

module.exports = Container;
