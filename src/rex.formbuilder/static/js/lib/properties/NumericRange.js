/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');

var RangedProperty = require('./RangedProperty');


class FloatSupportingNumberNode extends ReactForms.schema.NumberNode {
  getDefaultProps() {
    return {
      input: <input type='number' step='any' />
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

