/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @noflow
 */

import * as React from "react";
import type { schema } from "react-forms";
import { emptyFunction } from "../lang";
import * as KeyPath from "../KeyPath";
import * as Schema from "../form/Schema";
import {
  Form,
  type AsyncValidate,
  type Props as FormProps,
  ERROR_SENTINEL
} from "../form/Form";
import filterFormValue from "./filterFormValue";
import { ConfColumn } from "./Layout";
import { type Config as FieldConfig } from "./types";
import { type layout } from "../form";

type Props = {|
  ...FormProps,

  /**
   * An array of form field specifications.
   */
  fields: FieldConfig[],

  /**
   * Disable validation.
   */
  disableValidation?: boolean,

  /**
   * When ``true``, no submit button is rendered.
   */
  readOnly?: boolean,

  /**
   * When **layout** === ``'row'``,
   * the form fields are arranged horizontally;
   * otherwise vertically.
   */
  layout?: layout,

  /**
   * The submit button element to use.
   */
  submitButton?: React.Node
|};

/**
 * Form which has fieldset configurable through URL mapping.
 *
 * @public
 */
export class ConfForm extends React.Component<Props> {
  static defaultProps = {
    layout: "column",
    onChange: emptyFunction.thatReturnsArgument
  };

  _schema: null | Schema;
  _form: any;
  _validator: null | FieldValidator[];

  constructor(props: Props) {
    super(props);
    this._schema = null;
    this._form = null;

    if (!this.props.disableValidation) {
      this._schema = Schema.fromFields(this.props.fields);
      this._validator = validatorFromFields(this.props.fields);
    }
  }

  render() {
    let {
      fields,
      readOnly,
      layout,
      submitButton,
      disableValidation: _disableValidation,
      ...props
    } = this.props;
    return (
      <Form
        {...props}
        validate={this._validator ? this._validate : null}
        ref={this.onForm}
        schema={this._schema}
        onChange={this.onChange}
        submitButton={readOnly ? null : submitButton}
      >
        <ConfColumn fields={fields} fieldProps={{ readOnly }} />
      </Form>
    );
  }

  _validate: AsyncValidate = (root, errorList) => {
    const hasErrorByKeyPath = {};
    for (const error of errorList) {
      // $FlowFixMe: ...
      if (error[ERROR_SENTINEL]) {
        continue;
      }
      hasErrorByKeyPath[error.field] = true;
    }
    const filter = item => {
      const keyPath = `data.${item.valueKey.join(".")}`;
      return !hasErrorByKeyPath[keyPath];
    };
    return validate(this._validator, root, this.props.context, { filter });
  };

  componentWillReceiveProps({ fields }) {
    if (fields !== this.props.fields) {
      this._schema = Schema.fromFields(fields);
      this._validator = validatorFromFields(fields);
    }
  }

  onForm = (form: any) => {
    this._form = form;
  };

  onChange = (value: mixed, prevValue: mixed) => {
    value = filterFormValue(value, this._schema.hideIfList);
    return this.props.onChange(value, prevValue, value.value);
  };

  submit = () => {
    return this._form.submit();
  };
}

type FieldValidator = {
  valueKey: string[],
  validateList: FieldValidator[]
};

/**
 * Collect a list of validators out of fields specification.
 */
export function validatorFromFields(fields, trace = []): FieldValidator[] {
  let validatorList = [];
  for (let field of fields) {
    if (field.type === "fieldset") {
      validatorList = validatorList.concat(
        validatorFromFields(field.fields, trace.concat(field.valueKey)) || []
      );
    } else if (field.type === "list") {
      let _validatorList = validatorFromFields(field.fields);
      if (_validatorList) {
        validatorList.push({
          valueKey: field.valueKey,
          validateList: _validatorList
        });
      }
    } else {
      if (field.validate != null) {
        validatorList.push({
          valueKey: trace.concat(field.valueKey),
          validate: field.validate
        });
      }
    }
  }
  return validatorList.length > 0 ? validatorList : null;
}

/**
 * Run `validators` with a `root` value and a specified `context`.
 */
export function validate(
  validators: FieldValidator[],
  root: Object,
  context: Object = {},
  { filter } = {}
) {
  let contextParams = {};
  for (let key in context) {
    if (context.hasOwnProperty(key)) {
      let value = context[key];
      if (value["meta:type"] !== undefined) {
        contextParams[key] = value.id;
      } else {
        contextParams[key] = value;
      }
    }
  }
  const tasks = [];
  validators.forEach(item => {
    if (filter != null && !filter(item)) {
      return;
    }
    if (item.validate != null) {
      tasks.push(validateItem(item, root, contextParams));
    } else if (item.validateList != null) {
      tasks.push(...validateList(item, root, contextParams, filter));
    }
  });
  return Promise.all(tasks);
}

function validateList(validator, root, contextParams, filter) {
  let items = KeyPath.get(validator.valueKey, root) || [];
  let tasks = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < validator.validateList.length; j++) {
      let origValidator = validator.validateList[j];
      let itemValidator = {
        ...origValidator,
        valueKey: validator.valueKey.concat(i, origValidator.valueKey)
      };
      if (filter != null && !filter(itemValidator)) {
        continue;
      }
      tasks.push(validateItem(itemValidator, root, contextParams));
    }
  }
  return tasks;
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
    id: parent.id
  };
  let data = new FormData();
  data.append("data", JSON.stringify(payload));
  return validator.validate
    .data(data)
    .produce()
    .then(result => {
      let firstKey = Object.keys(result)[0];
      let message = result[firstKey];
      return {
        message,
        field: validator.valueKey.join(".")
      };
    });
}
