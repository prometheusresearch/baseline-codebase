/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var cx    = React.addons.classSet;

var TextArea = React.createClass({

  render() {
    var {value, className, ...props} = this.props;
    return (
      <textarea
        {...props}
        className={cx("rfb-TextArea", className)}
        value={value}
        onChange={this.onChange}
        />
    );
  },

  getDefaultProps() {
    return {
      value: '',
    };
  },

  onChange(e) {
    var value = e.target.value;
    if (!value)
      value = undefined;
    if (this.props.onChange)
      this.props.onChange(value);
  }
});

module.exports = TextArea;
