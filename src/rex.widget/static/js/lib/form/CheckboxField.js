/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {WithFormValue} from 'react-forms';

import Field from './Field';
import ReadOnlyField from './ReadOnlyField';

export let Checkbox = React.createClass({

  render() {
    return (
      <input
        type="checkbox"
        style={{marginTop: 9}}
        checked={this.props.value}
        onChange={this.onChange} 
        />
    );
  },

  onChange(e) {
    this.props.onChange(e.target.checked);
  }
});

/**
 * Renders a <Field> with an <input> of type="checkbox" or
 * if ``readOnly`` is true then renders a <ReadOnlyField>.
 *
 * @public
 */
export let CheckboxField = React.createClass({

  propTypes: {
    /**
     * When ``true``, a <ReadOnlyField> is displayed;
     * otherwise an <input type="checkbox" ... /> widget is displayed.
     */
    readOnly: React.PropTypes.bool,

    /**
     * A form value object whose **value** property contains 
     * the initial value of the checkbox.
     */
    formValue: React.PropTypes.object.isRequired,
  },

  render() {
    let {readOnly, formValue, select, selectFormValue, ...props} = this.props;
    if (readOnly) {
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {formValue.value ? 'Yes' : 'No'}
        </ReadOnlyField>
      );
    } else {
      return (
        <Field {...props} formValue={formValue} data={undefined}>
          <Checkbox />
        </Field>
      );
    }
  }
});

export default WithFormValue(CheckboxField);
