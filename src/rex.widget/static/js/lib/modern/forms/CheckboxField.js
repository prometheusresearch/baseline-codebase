/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react/addons');
var DataSpecificationMixin  = require('../DataSpecificationMixin');
var DataSpecification       = require('../DataSpecification');
var Field                   = require('./Field');

var Checkbox = React.createClass({

  render() {
    return (
      <input
        type="checkbox"
        checked={this.props.value}
        onChange={this.onChange} 
        />
    );
  },

  onChange(e) {
    this.props.onChange(e.target.checked);
  }
});

var CheckboxField = React.createClass({

  render() {
    return (
      <Field {...this.props} data={undefined}>
        <Checkbox />
      </Field>
    );
  }
});

module.exports = CheckboxField;
