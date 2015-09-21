/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var {VBox}            = require('../Layout');
var isReactElement    = require('../isReactElement');
var Fieldset          = require('./Fieldset');
var ReadOnlyField     = require('./ReadOnlyField');
var Field             = require('./Field');
var IntegerField      = require('./IntegerField');
var NumberField       = require('./NumberField');
var DatepickerField   = require('./DatepickerField');
var DateField         = require('./DateField');
var CheckboxField     = require('./CheckboxField');
var SelectField       = require('./SelectField');
var AutocompleteField = require('./AutocompleteField');
var RepeatingFieldset = require('./RepeatingFieldset');
var FileUploadField   = require('./FileUploadField')


var FIELDS_WITH_READONLY_MODE = ['entity', 'bool', 'enum'];

/**
 * ConfigurableField component.
 *
 * The field object is rendered according to its **type**.
 * field.type must be one of:
 *
 * - 'date'
 * - 'bool'
 * - 'file'
 * - 'enum'
 * - 'entity'
 * - 'integer'
 * - 'number'
 * - 'calculation'
 * - 'fieldset'
 * - 'list'
 *
 * @public
 */
var ConfigurableField = React.createClass({

  propTypes: {

    /**
     * Where is the field object described?  @ask-andrey
     */
    field: React.PropTypes.object,

    /**
     * Where is the formValue object described?  @ask-andrey
     *
     * The initial value of the field. 
     */
    formValue: React.PropTypes.object,

    /**
     * When ``true``, a <ReadOnlyField> is displayed;
     */
    readOnly: React.PropTypes.bool,

    /**
     * Unitless number representing the amount of space this widget uses
     * relative to all its sibling widgets.
     */
    size: React.PropTypes.number
  },

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
      return React.cloneElement(field.widget, {
        key: field.valueKey,
        label: field.label,
        hint: field.hint,
        selectFormValue: field.valueKey,
        formValue: formValue,
        readOnly: readOnly
      });
    } else if (!readOnly && field.widget && isReactElement(field.widget.edit)) {
      return React.cloneElement(field.widget.edit, {
        key: field.valueKey,
        label: field.label,
        hint: field.hint,
        selectFormValue: field.valueKey,
        formValue: formValue
      });
    } else if (readOnly && field.widget && isReactElement(field.widget.show)) {
      return React.cloneElement(field.widget.show, {
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
          <DateField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            selectFormValue={field.valueKey}
            formValue={formValue}
            minDate={field.minDate}
            maxDate={field.maxDate}
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
            {field.fields.map(f => <ConfigurableField field={f} selectFormValue={f.valueKey} />)}
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
