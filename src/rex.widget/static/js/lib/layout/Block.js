/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var cx              = React.addons.classSet;
var PropTypes       = React.PropTypes;

var Block = React.createClass({

  propTypes: {
    size: PropTypes.number,
    grow: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    shrink: PropTypes.oneOfType([PropTypes.bool, PropTypes.number])
  },

  render() {
    var style = {};
    var grow = 0 + this.props.grow; // coerce Boolean to Number
    if (grow) {
      style.flexGrow = grow;
    }
    var shrink = 0 + this.props.shrink; // coerce Boolean to Number
    if (shrink) {
      style.flexShrink = shrink;
    }
    if (this.props.size) {
      style.flex = this.props.size;
    }
    if (this.props.height) {
      style.height = this.props.height;
    }
    if (this.props.width) {
      style.width = this.props.width;
    }
    return (
      <div style={style} className={cx('rex-widget-Block', this.props.className)}>
        {this.props.children}
      </div>
    );
  }
});

module.exports = Block;
