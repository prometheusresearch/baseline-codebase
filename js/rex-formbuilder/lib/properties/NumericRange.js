/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

"use strict";

var React = require("react");
var ReactForms = require("react-forms-old");

var RangedProperty = require("./RangedProperty");

let Input = React.forwardRef((props, ref) => {
  let { dirtyOnBlur, dirtyOnChange, name, ...domProps } = props;
  return <input {...domProps} type="number" step="any" />;
});

class FloatSupportingNumberNode extends ReactForms.schema.NumberNode {
  getDefaultProps() {
    return {
      input: <Input />
    };
  }
}

class NumericRange extends RangedProperty {
  static create(props) {
    props = props || {};
    props.scalarType = FloatSupportingNumberNode;
    return RangedProperty.create(props);
  }
}

module.exports = NumericRange;
