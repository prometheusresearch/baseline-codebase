/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');
var cx    = React.addons.classSet;

var YAMLEditor = React.createClass({

  render() {
    var {value, className, hidden, ...props} = this.props;
    var style = hidden ? 'display: none' : null;
    var classSet = {
      "rfb-YAMLEditor": true,
      "rfb-YAMLEditor--hidden": hidden
    };
    if (className)
      classSet[className] = true;
    return (
      <textarea
        {...props}
        className={cx(classSet)}
        value={value}
        onChange={this.onChange}
        />
    );
  },

  getDefaultProps() {
    return {
      value: '',
      onChange: function () {}
    };
  },

  onChange(e) {
    var value = e.target.value;
    if (!value)
      value = undefined;
    this.props.onChange(value);
  }
});

module.exports = YAMLEditor;
