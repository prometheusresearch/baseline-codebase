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

/**
 * Renders a <Field> with a <Select>
 * or a <ReadOnlyField> if ``readOnly`` is true.
 *
 * @public
 */
var SelectField = React.createClass({
  mixins: [DataSpecificationMixin],

  dataSpecs: {
    dataSpec: collection()
  },

  fetchDataSpecs: {
    dataSpec: true
  },

  propTypes: {

    /**
     * Set to false, if you want an empty value in the drop-down list.
     */
    noEmptyValue: React.PropTypes.bool,     

    /**
     * The initial value of the field.
     * @ask-andrey to please explain the properties of this object.  
     */
    formValue: React.PropTypes.object,

    /**
     * Set to true to render a <ReadOnlyField>.
     */
    readOnly: React.PropTypes.bool,     

    /**
     * The list of items to appear in the drop-down before the data.
     * Each element in the list must have an id and a title.
     */
    options: React.PropTypes.array
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
