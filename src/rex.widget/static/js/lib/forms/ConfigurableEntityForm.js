/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import autobind         from 'autobind-decorator';
import React            from 'react';
import * as SchemaUtils from './SchemaUtils';
import EntityForm       from './EntityForm';
import FormColumn       from './FormColumn';

/**
 * Form which has fieldset configurable through URL mapping.
 *
 * @public
 */
export default class ConfigurableEntityForm extends React.Component {

  static propTypes = {
    ...EntityForm.PropTypes,

    /**
     * An array of form field specifications.
     */
    fields: React.PropTypes.array.isRequired,

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
  };

  render() {
    let {fields, readOnly, layout, submitButton, ...props} = this.props;
    return (
      <EntityForm
        {...props}
        ref="form"
        schema={this._schema}
        submitButton={readOnly ? null : submitButton}>
        <FormColumn
          selectFormValue
          fields={fields}
          fieldProps={{readOnly}}
          />
      </EntityForm>
    );
  }

  componentWillMount() {
    this._schema = SchemaUtils.generateSchemaFromFields(this.props.fields);
  }

  componentWillReceiveProps({fields, schema}) {
    if (schema !== this.props.schema || fields !== this.props.fields) {
      this._schema = SchemaUtils.generateSchemaFromFields(fields);
    }
  }

  @autobind
  submit() {
    return this.refs.form.submit();
  }
}
