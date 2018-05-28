/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {VBox} from '@prometheusresearch/react-ui';
import isReactElement from '../isReactElement';

import Fieldset from './Fieldset';
import ReadOnlyField from './ReadOnlyField';
import Field from './Field';
import IntegerField from './IntegerField';
import NumberField from './NumberField';
import DateField from './DateField';
import CheckboxField from './CheckboxField';
import SelectField from './SelectField';
import RepeatingFieldset from './RepeatingFieldset';
import FileUploadField from './FileUploadField';

const FIELDS_WITH_READONLY_MODE = ['entity', 'bool', 'enum', 'file', 'list', 'fieldset'];

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
let ConfigurableField = React.createClass({
  propTypes: {
    /**
     * Field structure from server. (Usually a result of
     * ``rex.widget.FormFieldVal()`` validator).
     */
    field: React.PropTypes.object,

    /**
     * Form value.
     *
     * It has the following properties:
     *
     * - ``value`` represents the current value at the field
     * - ``errorList`` represents the list of validation errors
     * - ``schema`` schema node at field (if present)
     *
     * See React Forms docs for more info.
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
    size: React.PropTypes.number,
  },

  render() {
    let {size} = this.props;
    return (
      <VBox flexGrow={size}>
        {this.renderField()}
      </VBox>
    );
  },

  renderField() {
    let {field, formValue, readOnly} = this.props;

    if (field.hideIf) {
      let hide = field.hideIf(
        formValue.value,
        formValue.parent ? formValue.parent.value : null,
      );
      if (hide) {
        return null;
      }
    }

    readOnly = field.readOnly || readOnly;
    if (isReactElement(field.widget)) {
      return React.cloneElement(field.widget, {
        key: field.valueKey,
        label: field.label,
        hint: field.hint,
        select: field.valueKey,
        formValue: formValue,
        readOnly: readOnly,
        validate: field.validate,
      });
    } else if (!readOnly && field.widget && isReactElement(field.widget.edit)) {
      return React.cloneElement(field.widget.edit, {
        key: field.valueKey,
        label: field.label,
        hint: field.hint,
        select: field.valueKey,
        formValue: formValue,
        validate: field.validate,
      });
    } else if (readOnly && field.widget && isReactElement(field.widget.show)) {
      return React.cloneElement(field.widget.show, {
        key: field.valueKey,
        label: field.label,
        hint: field.hint,
        select: field.valueKey,
        formValue: formValue,
        validate: field.validate,
      });
    } else if (readOnly && FIELDS_WITH_READONLY_MODE.indexOf(field.type) === -1) {
      return (
        <ReadOnlyField
          key={field.valueKey}
          label={field.label}
          hint={field.hint}
          select={field.valueKey}
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
            select={field.valueKey}
            formValue={formValue}
            minDate={field.minDate}
            maxDate={field.maxDate}
            validate={field.validate}
          />
        );
      case 'bool':
        return (
          <CheckboxField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            select={field.valueKey}
            formValue={formValue}
            readOnly={readOnly}
            validate={field.validate}
          />
        );
      case 'file':
        return (
          <FileUploadField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            select={field.valueKey}
            formValue={formValue}
            storage={field.storage}
            column={field.column}
            readOnly={readOnly}
            validate={field.validate}
          />
        );
      case 'enum':
        return (
          <SelectField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            select={field.valueKey}
            formValue={formValue}
            options={field.options || field.values}
            readOnly={readOnly}
            validate={field.validate}
          />
        );
      case 'integer':
        return (
          <IntegerField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            select={field.valueKey}
            formValue={formValue}
            validate={field.validate}
          />
        );
      case 'number':
        return (
          <NumberField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            select={field.valueKey}
            formValue={formValue}
            validate={field.validate}
          />
        );
      case 'calculation':
        return (
          <ReadOnlyField
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            select={field.valueKey}
            formValue={formValue}
            validate={field.validate}
          />
        );
      case 'fieldset':
        return (
          <Fieldset
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            select={field.valueKey}>
            {field.fields.map(f =>
              <ConfigurableField key={f.valueKey} field={f} readOnly={readOnly} />,
            )}
          </Fieldset>
        );
      case 'list':
        return (
          <RepeatingFieldset
            key={field.valueKey}
            label={field.label}
            readOnly={readOnly}
            hint={field.hint}
            formValue={formValue}
            layout={field.layout}
            select={field.valueKey}>
            {field.fields.map(f =>
              <ConfigurableField
                key={f.valueKey}
                field={f}
                select={f.valueKey}
                readOnly={readOnly}
              />,
            )}
          </RepeatingFieldset>
        );
      default:
        return (
          <Field
            key={field.valueKey}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            select={field.valueKey}
            validate={field.validate}
          />
        );
    }
  },

  getDefaultProps() {
    return {
      size: 1,
    };
  },
});

export default ConfigurableField;
