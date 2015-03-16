/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react/addons');
var DataSpecificationMixin  = require('../DataSpecificationMixin');
var DataSpecification       = require('../DataSpecification');
var BaseSelect              = require('../Select');
var Field                   = require('./Field');

var {collection}            = DataSpecification;

var Select = React.createClass({

  render() {
    return <BaseSelect {...this.props} onChange={this.onChange} />;
  },

  onChange(value) {
    if (value === null) {
      value = undefined;
    }
    this.props.onChange(value);
  }
});

var SelectField = React.createClass({
  mixins: [DataSpecificationMixin],

  dataSpecs: {
    dataSpec: collection()
  },

  fetchDataSpecs: {
    dataSpec: true
  },

  render() {
    var {noEmptyValue, ...props} = this.props;
    var {dataSpec: data} = this.data;
    return (
      <Field {...props} data={undefined}>
        <Select
          noEmptyValue={noEmptyValue}
          data={data}
          />
      </Field>
    );
  }
});

module.exports = SelectField;
