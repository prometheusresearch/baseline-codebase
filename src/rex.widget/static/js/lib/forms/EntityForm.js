/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var emptyFunction     = require('../emptyFunction');
var forceRefreshData  = require('../DataSpecificationMixin').forceRefreshData;
var Query             = require('../Query');
var Form              = require('./Form');
var Fieldset          = require('./Fieldset');

/**
 * Form which operates on a single entity within the port response.
 */
var EntityForm = React.createClass({

  propTypes: {
    ...Form.PropTypes,

    /**
     * Name of the entity.
     */
    entity: React.PropTypes.string.isRequired,

    /**
     * Form schema.
     */
    schema: React.PropTypes.object.isRequired,

    /**
     * Initial form value.
     */
    value: React.PropTypes.object
  },

  render() {
    var {children, entity, schema, value, ...props} = this.props;
    var formValue = makeEntityValue(entity, value);
    var formSchema = makeEntitySchema(entity, schema);
    return (
      <Form
        {...props}
        ref="form"
        schema={formSchema}
        value={formValue}
        transformValueOnSubmit={this.transformValueOnSubmit}
        onSubmitComplete={this.onSubmitComplete}>
        <Fieldset selectFormValue={[entity, 0]}>
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
    } else if (this.props.submitTo.port instanceof Query) {
      return value[this.props.entity][0];
    } else {
      return value;
    }
  },

  onSubmitComplete(data) {
    forceRefreshData();
    if (this.props.submitTo.port instanceof Query) {
      this.props.onSubmitComplete(data);
    } else {
      this.props.onSubmitComplete(data[this.props.entity][0]);
    }
  },

  submit() {
    return this.refs.form.submit();
  }
});

function makeEntitySchema(entity, schema) {
  var portSchema = {
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
  var portValue = {};
  portValue[entity] = [value];
  return portValue;
}

module.exports = EntityForm;
