/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import Select from '../Select';
import {Preloader} from '../../ui';
import {Fetch} from '../../data';
import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import {withFormValue} from 'react-forms';

/**
 * Renders a <Field> with a <Select>
 * or a <ReadOnlyField> if ``readOnly`` is true.
 *
 * @public
 */
export class SelectField extends React.Component {

  static propTypes = {

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
  };

  render() {
    let {
      noEmptyValue,
      formValue,
      readOnly,
      options,
      select,
      selectFormValue,
      fetched: {data},
      ...props
    } = this.props;
    if (readOnly) {
      let value;
      if (formValue.value) {
        if (options) {
          value = findByValue(options, formValue.value);
        } else if (data.updating) {
          value = <Preloader />;
        } else {
          value = findByValue(data.data, formValue.value);
        }
      }
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {value}
        </ReadOnlyField>
      );
    } else {
      return (
        <Field {...props} formValue={formValue}>
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
}

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

function fetch({data, options}) {
  return options ? {} : {data};
}

export default Fetch(fetch)(withFormValue(SelectField));
