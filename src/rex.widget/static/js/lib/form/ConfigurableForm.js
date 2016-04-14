/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {autobind, emptyFunction} from '../../lang';
import * as Schema from './Schema';
import Form from './Form';
import FormColumn from './FormColumn';
import filterFormValue from './filterFormValue';

/**
 * Form which has fieldset configurable through URL mapping.
 *
 * @public
 */
export default class ConfigurableForm extends React.Component {

  static propTypes = {
    ...Form.PropTypes,

    /**
     * An array of form field specifications.
     */
    fields: React.PropTypes.array.isRequired,

    /**
     * Disable validation.
     */
    disableValidation: React.PropTypes.bool,

    /**
     * When ``true``, no submit button is rendered.
     */
    readOnly: React.PropTypes.bool,

    /**
     * When **layout** === ``'row'``, 
     * the form fields are arranged horizontally;
     * otherwise vertically.
     */
    layout: React.PropTypes.string,

    /**
     * The submit button element to use.
     */
    submitButton: React.PropTypes.element
  };

  static defaultProps = {
    layout: 'column',
    onChange: emptyFunction.thatReturnsArgument,
  };

  constructor(props) {
    super(props);
    this._schema = null;
    this._form = null;

    if (!this.props.disableValidation) {
      this._schema = Schema.fromFields(this.props.fields);
    }
  }

  render() {
    let {fields, readOnly, layout, submitButton, ...props} = this.props;
    return (
      <Form
        {...props}
        ref={this.onForm}
        schema={this._schema}
        onChange={this.onChange}
        submitButton={readOnly ? null : submitButton}>
        <FormColumn
          fields={fields}
          fieldProps={{readOnly}}
          />
      </Form>
    );
  }

  componentWillReceiveProps({fields}) {
    if (fields !== this.props.fields) {
      this._schema = Schema.fromFields(fields);
    }
  }

  @autobind
  onForm(form) {
    this._form = form;
  }

  @autobind
  onChange(value, prevValue) {
    value = filterFormValue(value, this._schema.hideIfList);
    return this.props.onChange(value, prevValue);
  }

  @autobind
  submit() {
    return this._form.submit();
  }
}
