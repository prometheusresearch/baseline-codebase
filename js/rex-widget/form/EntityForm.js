/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import type { value, schema, error } from "react-forms";
import { forceRefreshData, Port, Mutation, type Fetcher } from "../data";
import { emptyFunction } from "../lang";
import { Form, type Props as FormProps } from "./Form";
import { Fieldset } from "./Fieldset";

function needExtract(submitTo) {
  return submitTo instanceof Port || submitTo instanceof Mutation;
}

type Props = {
  ...FormProps,

  /**
   * Name of the entity.
   */
  entity: string,

  /**
   * Form schema in JSON Schema format.
   */
  schema: schema,

  /**
   * Initial form value.
   */
  value: value,

  initialValue: value,

  /**
   * func
   *
   * Callback which fires after form submit is complete.
   */
  onSubmitComplete: mixed => void,

  submitTo: Fetcher<any>,

  children: React.Node,
  transformValueOnSubmit?: mixed => mixed,
  validate?: (mixed, error[]) => Promise<{ [key: string]: error }>
};

/**
 * Form which operates on a single entity within the port response.
 *
 * @public
 */
export default class EntityForm extends React.Component<Props> {
  _form: any;

  static defaultProps = {
    onSubmitComplete: emptyFunction,
    value: {}
  };

  constructor(props: Props) {
    super(props);
    this._form = null;
  }

  render() {
    let {
      children,
      entity,
      schema,
      value,
      initialValue,
      ...props
    } = this.props;
    let formValue: any = { [entity]: [value] };
    return (
      <Form
        {...props}
        ref={this.onForm}
        validate={this.validate}
        schema={{
          type: "object",
          label: null,
          properties: {
            [entity]: {
              type: "array",
              items: schema
            }
          },
          required: [entity]
        }}
        value={formValue}
        initialValue={{
          [entity]: [initialValue]
        }}
        transformValueOnSubmit={this.transformValueOnSubmit}
        onSubmitComplete={this.onSubmitComplete}
      >
        <Fieldset select={[entity, 0]}>{children}</Fieldset>
      </Form>
    );
  }

  validate = (value: mixed, errorList: error[]) => {
    const { validate, entity } = this.props;
    if (!validate) {
      return Promise.resolve({});
    }
    // $FlowFixMe: ...
    value = value[entity] || [];
    value = value[0] || {};
    return validate(value, errorList).then(result => {
      for (let idx in result) {
        let item = result[idx];
        result[idx] = { ...item, field: `${entity}.0.${item.field}` };
      }
      return result;
    });
  };

  onForm = (form: any) => {
    this._form = form;
  };

  transformValueOnSubmit = (value: mixed) => {
    if (this.props.transformValueOnSubmit) {
      return this.props.transformValueOnSubmit(value);
    } else if (needExtract(this.props.submitTo)) {
      // $FlowFixMe: ...
      return value[this.props.entity][0];
    } else {
      return value;
    }
  };

  onSubmitComplete = (data: {}) => {
    forceRefreshData();
    if (needExtract(this.props.submitTo)) {
      this.props.onSubmitComplete(data[this.props.entity][0]);
    } else {
      this.props.onSubmitComplete(data);
    }
  };

  submit = () => {
    return this._form.submit();
  };
}
