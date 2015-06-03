/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var ConfigurableField = require('./ConfigurableField');
var SchemaUtils       = require('./SchemaUtils');
var EntityForm        = require('./EntityForm');

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

    readOnly: React.PropTypes.bool
  },

  render() {
    var {fields, readOnly, submitButton, ...props} = this.props;
    var children = fields.map(field =>
      <ConfigurableField
        selectFormValue={field.valueKey}
        key={field.valueKey}
        field={field}
        readOnly={readOnly}
        />
    );
    return (
      <EntityForm
        {...props}
        ref="form"
        schema={this._schema}
        submitButton={readOnly ? null : submitButton}>
        {children}
      </EntityForm>
    );
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
