/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');


class LongText extends ReactForms.schema.ScalarNode {
  getDefaultProps() {
    return {
      input: <textarea />
    };
  }
}


module.exports = LongText;

