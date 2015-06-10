/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var {cloneWithProps}  = React.addons;
var {VBox}            = require('../Layout');
var isReactElement    = require('../isReactElement');
var Fieldset          = require('../_forms/Fieldset');
var ReadOnlyField     = require('./ReadOnlyField');
var Field             = require('./Field');
var IntegerField      = require('./IntegerField');
var NumberField       = require('./NumberField');
var DatepickerField   = require('./DatepickerField');
var CheckboxField     = require('./CheckboxField');
var SelectField       = require('./SelectField');
var AutocompleteField = require('./AutocompleteField');
var RepeatingFieldset = require('./RepeatingFieldset');
var FileUploadField   = require('./FileUploadField')


var FIELDS_WITH_READONLY_MODE = ['entity', 'bool', 'enum'];


var ConfigurableField = React.createClass({

  render() {
    var {size} = this.props;
    return (
      <VBox size={size}>
        {this.renderField()}
      </VBox>
    );
  },

  renderField() {
    var {field, formValue, readOnly} = this.props;
    readOnly = field.readOnly || readOnly;
    if (isReactElement(field.widget)) {
      return cloneWithProps(field.widget, {
        key: field.valueKey,
        label: field.label,
        hint: field.hint,
        selectFormValue: field.valueKey,
        formValue: formValue,
        readOnly: readOnly
      });
    } else if (!readOnly && field.widget && isReactElement(field.widget.edit)) {
      return cloneWithProps(field.widget.edit, {
        key: field.valueKey,
        label: field.label,
        hint: field.hint,
        selectFormValue: field.valueKey,
        formValue: formValue
      });
    } else if (readOnly && field.widget && isReactElement(field.widget.show)) {
      return cloneWithProps(field.widget.show, {
        key: field.valueKey,
        label: field.label,
        hint: field.hint,
        selectFormValue: field.valueKey,
        formValue: formValue
      });
    } else if (readOnly && FIELDS_WITH_READONLY_MODE.indexOf(field.type) === -1) {
      return (
        <ReadOnlyField
          key={field.valueKey}
          label={field.label}
          hint={field.hint}
          selectFormValue={field.valueKey}
          formValue={formValue}
          />
      );
    }
    switch (field.type) {
      case 'date':
        return (
          <DatepickerField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            />
        );
      case 'bool':
        return (
          <CheckboxField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            readOnly={readOnly}
            />
        );
      case 'file':
        return (
          <FileUploadField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            storage={field.storage}
            download={field.download}
            />
        );
      case 'enum':
        return (
          <SelectField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            options={field.options || field.values}
            readOnly={readOnly}
            />
        );
      case 'entity':
        return (
          <AutocompleteField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            dataSpec={field.data}
            readOnly={readOnly}
            />
        );
      case 'integer':
        return (
          <IntegerField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            />
        );
      case 'number':
        return (
          <NumberField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            />
        );
      case 'calculation':
        return (
          <ReadOnlyField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            />
        );
      case 'fieldset':
        return (
          <Fieldset
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            selectFormValue={field.valueKey}>
            {field.fields.map(f => <ConfigurableField field={f} />)}
          </Fieldset>
        );
      case 'list':
        return (
          <RepeatingFieldset
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            selectFormValue={field.valueKey}>
            {field.fields.map(f => <ConfigurableField field={f} />)}
          </RepeatingFieldset>
        );
      default:
        return (
          <Field
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            selectFormValue={field.valueKey}
            />
        );
    }
  },

  getDefaultProps() {
    return {
      size: 1
    };
  }
});

module.exports = ConfigurableField;
