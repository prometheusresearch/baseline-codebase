/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {emptyFunction} from '../../lang';
import * as KeyPath from '../KeyPath';
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
      this._validator = validatorFromFields(this.props.fields);
    }
  }

  render() {
    let {fields, readOnly, layout, submitButton, ...props} = this.props;
    return (
      <Form
        {...props}
        validate={this._validator && this._validate}
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

  _validate = (root) => {
    return validate(this._validator, root, this.props.context);
  };

  componentWillReceiveProps({fields}) {
    if (fields !== this.props.fields) {
      this._schema = Schema.fromFields(fields);
      this._validator = validatorFromFields(fields);
    }
  }

  onForm = (form) => {
    this._form = form;
  };

  onChange = (value, prevValue) => {
    value = filterFormValue(value, this._schema.hideIfList);
    return this.props.onChange(value, prevValue);
  };

  submit = () => {
    return this._form.submit();
  };
}

export function validatorFromFields(fields, trace = []) {
  let validatorList = [];
  for (let field of fields) {
    if (field.type === 'fieldset') {
      validatorList = validatorList.concat(
        validatorFromFields(field.fields, trace.concat(field.valueKey))
      );
    } else if (field.type === 'list') {
      validatorList = validatorList.push({
        valueKey: field.valueKey,
        validateList: validatorFromFields(field.fields)
      });
    } else {
      if (field.validate != null) {
        validatorList.push({
          valueKey: trace.concat(field.valueKey),
          validate: field.validate,
        });
      }
    }
  }
  return validatorList.length > 0 ? validatorList : null;
}

export function validate(validators, root, context = {}) {
  let contextParams = {};
  for (let key in context) {
    if (context.hasOwnProperty(key)) {
      let value = context[key];
      if (value['meta:type'] !== undefined) {
        contextParams[key] = value.id;
      } else {
        contextParams[key] = value;
      }
    }
  }
  let tasks = validators.map(item => {
    if (item.validate != null) {
      return validateItem(item, root, contextParams);
    } else if (item.validateList != null) {
      return validateList(item, root, [], contextParams);
    }
  });
  return Promise.all(tasks);
}

function validateList(validator, root, contextParams) {
  let items = KeyPath.get(validator.valueKey, root) || [];
  let tasks = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < validator.validatorList.length; j++) {
      let origValidator = validator.validateList[j];
      let itemValidator = {
        ...origValidator,
        valueKey: `${validator.valueKey.join('.')}.${i}.${origValidator.valueKey}`
      };
      tasks.push(validateItem(itemValidator, root, contextParams));
    }
  }
  return Promise.all(tasks);
}

function validateItem(validator, root, params) {
  const value = KeyPath.get(validator.valueKey, root);
  const parentValueKey = validator.valueKey.slice();
  parentValueKey.pop();
  const parent = KeyPath.get(parentValueKey, root) || {};
  const payload = {
    ...params,
    root,
    value,
    parent,
    id: parent.id,
  };
  let data = new FormData();
  data.append('data', JSON.stringify(payload));
  return validator.validate.data(data).produce().then(result => {
    let firstKey = Object.keys(result)[0];
    let message = result[firstKey];
    return {
      message,
      field: validator.valueKey.join('.'),
    };
  });
}
