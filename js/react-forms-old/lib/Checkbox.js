/**
 * @flow
 * @copyright Prometheus Research, LLC 2014
 */
"use strict";

var React = require("react");
var ReactCreateClass = require("create-react-class");
var PropTypes = require("prop-types");
var cx = require("classnames");

var Checkbox = ReactCreateClass({
  render(): ?ReactElement {
    var {
      value,
      onChange,
      className,
      dirtyOnChange,
      dirtyOnBlur,
      name,
      ...props
    } = this.props;
    return (
      <input
        {...props}
        type="checkbox"
        className={cx("rf-Checkbox", className)}
        onChange={this.onChange}
        checked={value}
      />
    );
  },

  onChange(e: { target: { checked: boolean } }) {
    var checked = e.target.checked;
    this.props.onChange(checked);
  }
});

module.exports = Checkbox;
