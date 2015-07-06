/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var {VBox, HBox}      = require('../Layout');
var renderFormItem    = require('./renderFormItem');

var FormRow = React.createClass({

  render() {
    var {fields, size, formValue, fieldProps} = this.props;
    return (
      <HBox size={size}>
        {fields.map((field, idx) => renderFormItem(formValue, field, fieldProps, idx))}
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      size: 1
    };
  }
});

module.exports = FormRow;
