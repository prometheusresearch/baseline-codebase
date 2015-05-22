/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var forceRefreshData  = require('../DataSpecificationMixin').forceRefreshData;
var emptyFunction     = require('../emptyFunction');
var Fieldset          = require('../_forms/Fieldset');
var Form              = require('./Form');
var ReadOnlyField     = require('./ReadOnlyField');
var Field             = require('./Field');
var DatepickerField   = require('./DatepickerField');
var CheckboxField     = require('./CheckboxField');
var SelectField       = require('./SelectField');
var AutocompleteField = require('./AutocompleteField');
var RepeatingFieldset = require('./RepeatingFieldset');
var FileUploadField   = require('./FileUploadField')
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
    var {fields, entity, schema, value, ...props} = this.props;
    var formValue = entity ?
      portValue(entity, value || {}) :
      {};
    return (
      <Form
        {...props}
        ref="form"
        schema={this._schema}
        value={formValue}
        onSubmitComplete={this.onSubmitComplete}>
        {this.renderFields(fields)}
      </Form>
    );
  },

  renderFields(fields, noPrefix) {
    return fields.map(field => this.renderField(field, noPrefix));
  },

  renderField(field, noPrefix) {
    var valueKey = noPrefix ?
      field.valueKey :
      prefixValueKey(field.valueKey, [this.props.entity, 0]);
    if (field.readOnly) {
      return (
        <ReadOnlyField
          key={valueKey}
          label={field.label}
          selectFormValue={valueKey}
          />
      );
    }
    switch (field.type) {
      case 'date':
        return (
          <DatepickerField
            key={valueKey}
            label={field.label}
            selectFormValue={valueKey}
            />
        );
      case 'bool':
        return (
          <CheckboxField
            key={valueKey}
            label={field.label}
            selectFormValue={valueKey}
            />
        );
      case 'file':
        return (
          <FileUploadField
            key={valueKey}
            label={field.label}
            selectFormValue={valueKey}
            storage={field.storage}
            download={field.download}
            />
        );
      case 'enum':
        return (
          <SelectField
            key={valueKey}
            label={field.label}
            selectFormValue={valueKey}
            options={field.values.map(v => ({id: v.value, title: v.label}))}
            />
        );
      case 'entity':
        return (
          <AutocompleteField
            key={valueKey}
            label={field.label}
            selectFormValue={valueKey}
            dataSpec={field.data}
            />
        );
      case 'fieldset':
        return (
          <Fieldset label={field.label} selectFormValue={valueKey} key={valueKey}>
            {this.renderFields(field.fields, true)}
          </Fieldset>
        );
      case 'list':
        return (
          <RepeatingFieldset label={field.label} selectFormValue={valueKey} key={valueKey}>
            {this.renderFields(field.fields, true)}
          </RepeatingFieldset>
        );
      default:
        return (
          <Field
            key={valueKey}
            label={field.label}
            selectFormValue={valueKey}
            />
        );
    }
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
