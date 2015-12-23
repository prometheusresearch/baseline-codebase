/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let React             = require('react');
let emptyFunction     = require('../emptyFunction');
let forceRefreshData  = require('../forceRefreshData');
let Form              = require('./Form');
let Fieldset          = require('./Fieldset');

import {Port}         from '../data/Port';
import {Mutation}     from '../data/Mutation';

function needExtract(submitTo) {
  return (
    (submitTo instanceof Port) ||
    (submitTo instanceof Mutation) ||
    (submitTo.port instanceof Port) ||
    (submitTo.port instanceof Mutation)
  );
}

/**
 * Form which operates on a single entity within the port response.
 *
 * @public
 */
let EntityForm = React.createClass({

  propTypes: {
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
    onSubmitComplete: React.PropTypes.func
  },

  render() {
    let {children, entity, schema, value, ...props} = this.props;
    let formValue = makeEntityValue(entity, value);
    let formSchema = makeEntitySchema(entity, schema);
    return (
      <Form
        {...props}
        ref="form"
        schema={formSchema}
        value={formValue}
        transformValueOnSubmit={this.transformValueOnSubmit}
        onSubmitComplete={this.onSubmitComplete}>
        <Fieldset select={[entity, 0]}>
          {children}
        </Fieldset>
      </Form>
    );
  },

  getDefaultProps() {
    return {
      onSubmitComplete: emptyFunction,
      value: {}
    };
  },

  transformValueOnSubmit(value) {
    if (this.props.transformValueOnSubmit) {
      return this.props.transformValueOnSubmit(value);
    } else if (!needExtract(this.props.submitTo)) {
      return value[this.props.entity][0];
    } else {
      return value;
    }
  },

  onSubmitComplete(data) {
    forceRefreshData();
    if (needExtract(this.props.submitTo)) {
      this.props.onSubmitComplete(data[this.props.entity][0]);
    } else {
      this.props.onSubmitComplete(data);
    }
  },

  submit() {
    return this.refs.form.submit();
  }
});

function makeEntitySchema(entity, schema) {
  let portSchema = {
    type: 'object',
    properties: {},
    required: [entity]
  };
  portSchema.properties[entity] = {
    type: 'array',
    items: schema
  };
  return portSchema;
}

function makeEntityValue(entity, value) {
  let portValue = {};
  portValue[entity] = [value];
  return portValue;
}

module.exports = EntityForm;
