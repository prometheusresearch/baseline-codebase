/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms-old');


let Input = React.forwardRef((props, ref) => {
  let { dirtyOnBlur, dirtyOnChange, name, ...domProps } = props;
  return <textarea {...domProps} />;
});

class LongText extends ReactForms.schema.ScalarNode {
  getDefaultProps() {
    return {
      input: <Input />
    };
  }
}


module.exports = LongText;

