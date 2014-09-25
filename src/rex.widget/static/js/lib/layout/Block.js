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
    var style = {
      minWidth: this.props.minWidth,
      minHeight: this.props.minHeight
    };
    var grow = 0 + this.props.grow; // coerce Boolean to Number
    if (grow) {
      style.flexGrow = grow;
      style.WebkitFlexGrow = grow;
    }
    var shrink = 0 + this.props.shrink; // coerce Boolean to Number
    if (shrink) {
      style.flexShrink = shrink;
      style.WebkitFlexShrink = shrink;
    }
    if (this.props.size) {
      style.flex = this.props.size;
      style.WebkitFlex = this.props.size;
    }
    if (this.props.fixedSize != undefined) {
      style.flex = style.flexShrink = style.flexGrow = undefined;
      style.WebkitFlex= style.WebkitFlexShrink = style.WebkitFlexGrow = undefined;
      if (this.props.vertical) {
        style.height = this.props.fixedSize;
      } else {
        style.width = this.props.fixedSize;
      }
    }
    if (this.props.forceSize != undefined) {
      if (this.props.vertical) {
        style.minHeight = this.props.forceSize;
        style.maxHeight = this.props.forceSize;
      } else {
        style.minWidth = this.props.forceSize;
        style.maxWidth = this.props.forceSize;
      }
    }
    return (
      <div style={style} className={cx('rw-Block', this.props.className)}>
        {this.props.children}
      </div>
    );
  }
});

module.exports = Block;
