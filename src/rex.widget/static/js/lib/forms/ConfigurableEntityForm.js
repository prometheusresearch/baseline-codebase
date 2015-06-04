/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var SchemaUtils       = require('./SchemaUtils');
var EntityForm        = require('./EntityForm');
var FormColumn        = require('./FormColumn');
var FormRow           = require('./FormRow');

/**
 * Form which has fieldset configurable through URL mapping.
 */
var ConfigurableEntityForm = React.createClass({

  propTypes: {
    ...EntityForm.PropTypes,

    /**
     * An array of form field specifications.
     */
    fields: React.PropTypes.array.isRequired,

    readOnly: React.PropTypes.bool,

    layout: React.PropTypes.string
  },

  render() {
    var {fields, readOnly, layout, submitButton, ...props} = this.props;
    var Layout = layout === 'row' ? FormRow : FormColumn;
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
  },

  getDefaultProps() {
    return {
      layout: 'column'
    };
  },

  componentWillMount() {
    this._schema = SchemaUtils.generateSchemaFromFields(this.props.fields);
  },

  componentWillReceiveProps({fields, schema}) {
    if (schema !== this.props.schema || fields !== this.props.fields) {
      this._schema = SchemaUtils.generateSchemaFromFields(fields);
    }
  },

  submit() {
    return this.refs.form.submit();
  }
});

module.exports = ConfigurableEntityForm;
