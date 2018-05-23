/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {withFormValue} from 'react-forms';

import {Fetch} from '../../data';
import {Preloader} from '../../ui';
import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import RadioGroup from './RadioGroup';
import contextParams from './contextParams';

export function Title({value, options}) {
  if (value === null) {
    return <noscript />;
  }
  for (let i = 0; i < options.length; i++) {
    if (options[i].id === value) {
      return <span>{options[i].title}</span>;
    }
  }
  return <noscript />;
}

/**
 * Renders a <Field> with an <input> of type="radio" or
 * if ``readOnly`` is true then renders a <ReadOnlyField>.
 *
 * @public
 */
export class RadioGroupField extends React.Component {

  static propTypes = {
    /**
     * When ``true``, a <ReadOnlyField> is displayed;
     * otherwise an <input type="radio" ... /> widget is displayed.
     */
    readOnly: React.PropTypes.bool,

    /**
     * A form value object whose **value** property contains the initial value
     * of the radio.
     */
    formValue: React.PropTypes.object.isRequired,

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
    let {readOnly, formValue, options, fetched, ...props} = this.props;
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
            <Title value={formValue.value} options={options} />}
        </ReadOnlyField>
      );
    } else {
      return (
        <Field {...props} formValue={formValue}>
          {updating ?
            <Preloader style={{marginTop: 9}} /> :
            <RadioGroup options={options} />}
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

export default withFormValue(FetchOptions(RadioGroupField));
