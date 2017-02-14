/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {withFormValue} from 'react-forms';

import {Fetch} from '../../data';
import {Preloader} from '../../ui';
import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import contextParams from './contextParams';
import CheckboxGroup, {
  primitiveValueStrategy,
  entityValueStrategy
} from './CheckboxGroup';

export function TitleList({value, options}) {
  value = value || [];
  options = options
    .filter(option => value.indexOf(option.id) > -1)
    .map(option => option.title);
  return (
    <div>
      {options.join(', ')}
    </div>
  );
}

/**
 * Renders a <Field> with an <input> of type="checkbox" or
 * if ``readOnly`` is true then renders a <ReadOnlyField>.
 *
 * @public
 */
export class CheckboxGroupField extends React.Component {

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

    /**
     * If form field should operate on a plain list of ids rather than a list of
     * objects with id attribute.
     */
    plain: React.PropTypes.bool,

    /**
     * Either an array of options or a producible which returns a list of
     * objects with `id` and `title` attributes.
     */
    options: React.PropTypes.oneOfType([
      React.PropTypes.array,
      React.PropTypes.object
    ]).isRequired,
  };

  render() {
    let {readOnly, formValue, options, fetched, plain, ...props} = this.props;
    let updating = false;

    if (!Array.isArray(options)) {
      updating = fetched.options.updating;
      options = fetched.options.data;
    }

    if (readOnly) {
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {updating ?
            <Preloader style={{marginTop: 9}} /> :
            <TitleList value={formValue.value} options={options} />}
        </ReadOnlyField>
      );
    } else {
      let valueStrategy = plain ? primitiveValueStrategy : entityValueStrategy;
      return (
        <Field {...props} formValue={formValue}>
          {updating ?
            <Preloader style={{marginTop: 9}} /> :
            <CheckboxGroup valueStrategy={valueStrategy} options={options} />}
        </Field>
      );
    }
  }
}

export function fetch({options, formValue}) {
  if (Array.isArray(options)) {
    return {};
  } else {
    options = options.params(contextParams(formValue.params.context));
    return {options};
  }
}

let FetchOptions = Fetch(fetch);

export default withFormValue(FetchOptions(CheckboxGroupField));
