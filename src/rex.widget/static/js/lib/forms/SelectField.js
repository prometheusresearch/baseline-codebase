/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                   from 'react';
import DataSpecificationMixin  from '../DataSpecificationMixin';
import DataSpecification       from '../DataSpecification';
import BaseSelect              from '../Select';
import Preloader               from '../Preloader';
import Field                   from './Field';
import ReadOnlyField           from './ReadOnlyField';

let {collection} = DataSpecification;

let Select = React.createClass({

  propTypes: {
    onChange: React.PropTypes.func,
  },

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
let SelectField = React.createClass({
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
     * Form value.
     *
     * It has the following properties:
     *
     * - ``value`` represents the current value at the field
     * - ``errorList`` represents the list of validation errors
     * - ``schema`` schema node at field (if present)
     *
     * See React Forms docs for more info.
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
    let {noEmptyValue, formValue, readOnly, options, ...props} = this.props;
    let {dataSpec: data} = this.data;
    if (readOnly) {
      let value;
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
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === value) {
      return options[i].label;
    }
  }
}

export default SelectField;
