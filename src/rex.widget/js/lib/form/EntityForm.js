/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {forceRefreshData} from '../data';
import {emptyFunction} from '../lang';
import {Port} from '../data/Port';
import {Mutation} from '../data/Mutation';
import Form from './Form';
import Fieldset from './Fieldset';

function needExtract(submitTo) {
  return (
    (submitTo instanceof Port) ||
    (submitTo instanceof Mutation)
  );
}

/**
 * Form which operates on a single entity within the port response.
 *
 * @public
 */
export default class EntityForm extends React.Component {

  static propTypes = {
    ...Form.PropTypes,

    /**
     * Name of the entity.
     */
    entity: React.PropTypes.string.isRequired,

    /**
     * Form schema in JSON Schema format.
     */
    schema: React.PropTypes.object.isRequired,

    /**
     * Initial form value.
     */
    value: React.PropTypes.object,

    /**
     * func
     *
     * Callback which fires after form submit is complete.
     */
    onSubmitComplete: React.PropTypes.func,
  };

  static defaultProps = {
    onSubmitComplete: emptyFunction,
    value: {}
  };

  constructor(props) {
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
    return (
      <Form
        {...props}
        ref={this.onForm}
        validate={this.validate}
        schema={{
          type: 'object',
          properties: {
            [entity]: {
              type: 'array',
              items: schema
            },
          },
          required: [entity]
        }}
        value={{
          [entity]: [value]
        }}
        initialValue={{
          [entity]: [initialValue]
        }}
        transformValueOnSubmit={this.transformValueOnSubmit}
        onSubmitComplete={this.onSubmitComplete}>
        <Fieldset select={[entity, 0]}>
          {children}
        </Fieldset>
      </Form>
    );
  }

  validate = (value, errorList) => {
    const {validate, entity} = this.props;
    if (!validate) {
      return Promise.resolve({});
    }
    value = value[entity] || [];
    value = value[0] || {};
    return validate(value, errorList).then(result => {
      for (let idx in result) {
        let item = result[idx];
        result[idx] = {...item, field: `${entity}.0.${item.field}`};
      }
      return result;
    });
  }

  onForm = (form) => {
    this._form = form;
  };

  transformValueOnSubmit = (value) => {
    if (this.props.transformValueOnSubmit) {
      return this.props.transformValueOnSubmit(value);
    } else if (needExtract(this.props.submitTo)) {
      return value[this.props.entity][0];
    } else {
      return value;
    }
  };

  onSubmitComplete = (data) => {
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
