/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {WithFormValue} from 'react-forms';

import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import Checkbox from './Checkbox';

/**
 * Renders a <Field> with an <input> of type="checkbox" or
 * if ``readOnly`` is true then renders a <ReadOnlyField>.
 *
 * @public
 */
export class CheckboxField extends React.Component {

  static propTypes = {
    /**
     * When ``true``, a <ReadOnlyField> is displayed;
     * otherwise an <input type="checkbox" ... /> widget is displayed.
     */
    readOnly: React.PropTypes.bool,

    /**
     * A form value object whose **value** property contains the initial value
     * of the checkbox.
     */
    formValue: React.PropTypes.object.isRequired,
  };

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
        <Field
          {...props}
          layout="horizontal"
          formValue={formValue}>
          <Checkbox style={{marginTop: 5}} />
        </Field>
      );
    }
  }
}

export default WithFormValue(CheckboxField);
