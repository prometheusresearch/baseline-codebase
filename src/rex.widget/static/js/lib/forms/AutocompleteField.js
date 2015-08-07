/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var Autocomplete            = require('../Autocomplete');
var Preloader               = require('../Preloader');
var DataSpecificationMixin  = require('../DataSpecificationMixin');
var {collection, prop}      = require('../DataSpecification');
var Field                   = require('./Field');
var ReadOnlyField           = require('./ReadOnlyField');

var AutocompleteField = React.createClass({

  render() {
    var {
      dataSpec, readOnly, formValue,
      valueAttribute, titleAttribute, style,
      ...props
    } = this.props;
    if (readOnly) {
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {formValue.value &&
            <EntityTitle
              dataSpec={dataSpec}
              titleAttribute={titleAttribute}
              value={formValue.value}
              />}
        </ReadOnlyField>
      );
    } else {
      return (
        <Field {...props} data={undefined} formValue={formValue}>
          <Autocomplete
            style={{resultList: style && style.resultList}}
            dataSpec={dataSpec}
            valueAttribute={valueAttribute}
            titleAttribute={titleAttribute}
            />
        </Field>
      );
    }
  }
});

var EntityTitle = React.createClass({
  mixins: [DataSpecificationMixin],

  dataSpecs: {
    dataSpec: collection({'*': prop('value')})
  },

  fetchDataSpecs: {
    dataSpec: true
  },

  render() {
    var {titleAttribute} = this.props;
    var {data} = this.data.dataSpec;
    if (data) {
      return <div>{data[0][titleAttribute]}</div>;
    } else {
      return null;
    }
  },

  getDefaultProps() {
    return {
      titleAttribute: 'title'
    };
  }
});

module.exports = AutocompleteField;

