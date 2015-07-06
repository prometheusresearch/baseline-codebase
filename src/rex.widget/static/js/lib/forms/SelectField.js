/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var DataSpecificationMixin  = require('../DataSpecificationMixin');
var DataSpecification       = require('../DataSpecification');
var BaseSelect              = require('../Select');
var Preloader               = require('../Preloader');
var Field                   = require('./Field');
var ReadOnlyField           = require('./ReadOnlyField');

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
    var {noEmptyValue, formValue, readOnly, options, ...props} = this.props;
    var {dataSpec: data} = this.data;
    if (readOnly) {
      var value;
      if (formValue.value) {
        if (options) {
          value = findByValue(options, formValue.value);
        } else if (data.loading) {
          value = <Preloader />;
        } else {
          value = findByValue(data.data, formValue.value);
        }
      }
      return (
        <ReadOnlyField {...props} formValue={formValue} dataSpec={undefined}>
          {value}
        </ReadOnlyField>
      );
    } else {
      return (
        <Field {...props} formValue={formValue} dataSpec={undefined}>
          <Select
            options={(options || []).map(v => ({id: v.value || v.id,
                                                title: v.label || v.title}))}
            noEmptyValue={noEmptyValue}
            data={data}
            />
        </Field>
      );
    }
  }
});

function findByValue(options, value) {
  if (!options) {
    return null;
  }
  for (var i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      return options[i].label;
    }
  }
}

module.exports = SelectField;
