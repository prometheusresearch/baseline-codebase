/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var Button            = require('../Button');
var forceRefreshData  = require('../DataSpecificationMixin').forceRefreshData;
var emptyFunction     = require('../emptyFunction');
var Form              = require('./Form');
var Fieldset          = require('../_forms/Fieldset');
var ConfigurableField = require('./ConfigurableField');
var SchemaUtils       = require('./SchemaUtils');

/**
 * Form which has fieldset configurable through URL mapping.
 */
var ConfigurableForm = React.createClass({

  propTypes: {
    /**
     * All props relevant for <Form /> are passed through.
     */
    ...Form.PropTypes,

    /**
     * Schema for the entity port returns.
     *
     * Usually port returns data in the form of::
     *
     *   {entity: [{...}, ...]}
     *
     * Using ConfigurableForm we need to define schema only for records within
     * the ``entity`` array.
     */
    schema: React.PropTypes.object,

    /**
     * Initial value for form.
     */
    value: React.PropTypes.object,

    /**
     * An array of fields in form of::
     *
     *   [
     *     {
     *       valueKey: <key for field>,
     *       label: <label>,
     *       type: <field type, one of 'string', 'date', 'bool', 'option',
     *                                 'autocomplete', 'list'>
     *     }
     *   ]
     */
    fields: React.PropTypes.array
  },

  render() {
    var {fields, children, entity, schema, value, readOnly, submitButton, ...props} = this.props;
    var formValue = entity ?
      portValue(entity, value || {}) :
      {};
    if (children !== undefined && fields !== undefined) {
      console.warn('<RexWidget.ConfigurableForm />: both "fields" and "children" props passed.');
    }
    if (children === undefined) {
      children = fields.map(field =>
        <ConfigurableField
          selectFormValue={field.valueKey}
          key={field.valueKey}
          field={field}
          readOnly={readOnly}
          />
      );
    }
    return (
      <Form
        {...props}
        ref="form"
        schema={this._schema}
        value={formValue}
        submitButton={submitButton !== null && !readOnly && <Button success>Submit</Button>}
        onSubmitComplete={this.onSubmitComplete}>
        <Fieldset selectFormValue={[this.props.entity, 0]}>
          {children}
        </Fieldset>
      </Form>
    );
  },

  getDefaultProps() {
    return {
      onSubmitComplete: emptyFunction
    };
  },

  componentWillMount() {
    this._schema = this._schemaFromProps(this.props);
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.schema !== this.props.schema || nextProps.fields !== this.props.fields) {
      this._schema = this._schemaFromProps(nextProps);
    }
  },

  _schemaFromProps(props) {
    var schema = props.schema ?
      props.schema :
      SchemaUtils.generateSchemaFromFields(props.fields);
    return portSchema(props.entity, schema);
  },

  submit() {
    return this.refs.form.submit();
  },

  onSubmitComplete(data) {
    forceRefreshData();
    this.props.onSubmitComplete(data);
  }
});

function portSchema(entity, schema) {
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

function portValue(entity, value) {
  var portValue = {};
  portValue[entity] = [value];
  return portValue;
}

function prefixValueKey(valueKey, prefix) {
  if (Array.isArray(valueKey)) {
    return prefix.concat(valueKey);
  } else {
    return `${prefix.join('.')}.${valueKey}`;
  }
}

module.exports = ConfigurableForm;
