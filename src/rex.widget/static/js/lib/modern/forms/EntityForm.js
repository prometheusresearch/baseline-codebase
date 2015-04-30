/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var {PropTypes}       = React;
var {cloneWithProps}  = React.addons;
var emptyFunction     = require('../emptyFunction');
var Form              = require('./Form');
var Fieldset          = require('../_forms/Fieldset');

/**
 * Form which operates on a single entity within the port response.
 */
var EntityForm = React.createClass({

  propTypes: {

    /**
     * Name of the entity as defined in port.
     */
    entity: PropTypes.string.isRequired,

    /**
     * Data schema.
     */
    schema: PropTypes.object.isRequired,

    /**
     * Data specification of where to submit form to.
     */
    submitTo: PropTypes.object.isRequired
  },

  render() {
    var {entity, schema, value, children, ...props} = this.props;
    schema = schemaForEntity(entity, schema);
    value = valueForEntity(entity, value);
    return (
      <Form
        {...props}
        ref="form"
        schema={schema}
        value={value}>
        <Fieldset selectFormValue={[entity, 0]}>
          {children}
        </Fieldset>
      </Form>
    );
  },

  getDefaultProps() {
    return {value: {}};
  },

  submit() {
    this.refs.form.submit();
  }
});

function schemaForEntity(entity, schema) {
  var entitySchema = {
    type: 'object',
    properties: {},
    required: [entity]
  };
  entitySchema.properties[entity] = {
    type: 'array',
    items: schema,
    minItems: 1,
    maxItems: 1
  };
  return entitySchema;
}

function valueForEntity(entity, value) {
  var entityValue = {};
  entityValue[entity] = [value];
  return entityValue;
}

module.exports = EntityForm;
