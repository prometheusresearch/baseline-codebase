/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";

import { VBox } from "react-stylesheet";
import { useFormValue, type value, type select } from "react-forms";
import { type Config } from "./types";
import { toReactKey } from "../KeyPath";

import { isReactElement } from "rex-ui/ReactUtil";
import {
  Fieldset,
  ViewValue,
  Field,
  IntegerField,
  NumberField,
  DateField,
  CheckboxField,
  SelectField,
  RepeatingFieldset,
  FileUploadField
} from "../form";

const FIELDS_WITH_READONLY_MODE = [
  "entity",
  "bool",
  "enum",
  "file",
  "list",
  "fieldset"
];

type Props = {
  /**
   * Field structure from server. (Usually a result of
   * ``rex.widget.FormFieldVal()`` validator).
   */
  field: Config,

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
  formValue?: value,
  select?: select,
  readOnly?: boolean
};

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
export let ConfField = (props: Props) => {
  let { field, formValue: formValueOfProps, readOnly } = props;
  let formValue = useFormValue(formValueOfProps, field.valueKey);
  readOnly = field.readOnly || readOnly;

  let element = null;

  if (
    field.hideIf &&
    field.hideIf(
      formValue.value,
      formValue.parent ? formValue.parent.value : null
    )
  ) {
    element = null;
  } else if (isReactElement(field.widget)) {
    let widget: React.Element<any> = (field.widget: any);
    element = React.cloneElement(widget, {
      key: toReactKey(field.valueKey),
      label: field.label,
      hint: field.hint,
      select: field.valueKey,
      formValue: formValue,
      readOnly: readOnly,
      validate: field.validate
    });
  } else if (
    !readOnly &&
    field.widget != null &&
    field.widget.edit != null &&
    isReactElement(field.widget.edit)
  ) {
    let widget: React.Element<any> = (field.widget.edit: any);
    element = React.cloneElement(field.widget.edit, {
      key: toReactKey(field.valueKey),
      label: field.label,
      hint: field.hint,
      select: field.valueKey,
      formValue: formValue,
      validate: field.validate
    });
  } else if (
    readOnly &&
    field.widget &&
    field.widget.show != null &&
    isReactElement(field.widget.show)
  ) {
    let widget: React.Element<any> = (field.widget.show: any);
    element = React.cloneElement(field.widget.show, {
      key: toReactKey(field.valueKey),
      label: field.label,
      hint: field.hint,
      select: field.valueKey,
      formValue: formValue,
      validate: field.validate
    });
  } else if (readOnly && FIELDS_WITH_READONLY_MODE.indexOf(field.type) === -1) {
    element = (
      <ViewValue
        key={toReactKey(field.valueKey)}
        label={field.label}
        hint={field.hint}
        formValue={formValue}
      />
    );
  } else {
    switch (field.type) {
      case "date":
        element = (
          <DateField
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            minDate={field.minDate}
            maxDate={field.maxDate}
          />
        );
        break;
      case "bool":
        element = (
          <CheckboxField
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            readOnly={readOnly}
          />
        );
        break;
      case "file":
        element = (
          <FileUploadField
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            storage={field.storage}
            download={field.column}
            readOnly={readOnly}
            validate={field.validate}
          />
        );
        break;
      case "enum":
        element = (
          <SelectField
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
            options={field.options || field.values}
            readOnly={readOnly}
          />
        );
        break;
      case "integer":
        element = (
          <IntegerField
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
          />
        );
        break;
      case "number":
        element = (
          <NumberField
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
          />
        );
        break;
      case "calculation":
        element = (
          <ViewValue
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
          />
        );
        break;
      case "fieldset":
        element = (
          <Fieldset
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
          >
            {field.fields.map(f => (
              <ConfField
                key={toReactKey(f.valueKey)}
                field={f}
                readOnly={readOnly}
              />
            ))}
          </Fieldset>
        );
        break;
      case "list":
        element = (
          <RepeatingFieldset
            key={toReactKey(field.valueKey)}
            label={field.label}
            readOnly={readOnly}
            hint={field.hint}
            formValue={formValue}
            layout={field.layout}
          >
            {field.fields.map(f => (
              <ConfField
                key={toReactKey(f.valueKey)}
                field={f}
                select={f.valueKey}
                readOnly={readOnly}
              />
            ))}
          </RepeatingFieldset>
        );
        break;
      default:
        element = (
          <Field
            key={toReactKey(field.valueKey)}
            label={field.label}
            hint={field.hint}
            formValue={formValue}
          />
        );
        break;
    }
  }

  return <VBox flexGrow={1}>{element}</VBox>;
};

export function renderFieldConfig(
  formValue: value,
  field: Config | React.Element<any>,
  props: Object,
  syntheticKey: null | string | number
) {
  if (isReactElement(field)) {
    let element: React.Element<any> = (field: any);
    return React.cloneElement(element, {
      formValue,
      fieldProps: props,
      key: syntheticKey
    });
  } else {
    let config: Config = (field: any);
    return (
      <ConfField
        {...props}
        key={toReactKey(config.valueKey)}
        formValue={formValue.select(config.valueKey)}
        field={field}
      />
    );
  }
}
