/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import * as ReactForms from "react-forms";
import { VBox, HBox, Element } from "react-stylesheet";
import { isReactElement } from "rex-ui/ReactUtil";
import { useDOMSize } from "rex-ui/Layout";
import * as rexui from "rex-ui";
import * as mui from "@material-ui/core";
import * as data from "../data";
import * as form from "../form";
import { type Config } from "./types";
import { toReactKey } from "../KeyPath";

type Props = {|
  initialValue: mixed,
  schema?: ReactForms.schema,
  config: Config
|};

export function ConfView({ config, schema, initialValue }: Props) {
  let value = React.useMemo(
    () => ReactForms.createValue({ schema, value: initialValue }),
    [initialValue, schema]
  );
  return (
    <form.FormLayout>
      <Field config={config} value={value} />
    </form.FormLayout>
  );
}

function Field({
  config,
  value
}: {|
  config: Config,
  value: ReactForms.value
|}) {
  let theme = rexui.useTheme();

  let element = null;

  if (
    config.hideIf &&
    config.hideIf(value.value, value.parent ? value.parent.value : null)
  ) {
    element = null;
  } else if (config.widget != null && isReactElement(config.widget)) {
    let widget: React.Element<any> = (config.widget: any);
    element = React.cloneElement(widget, {
      key: toReactKey(config.valueKey),
      label: config.label,
      hint: config.hint,
      formValue: value,
      readOnly: true
    });
  } else if (config.widget != null && config.widget.show != null) {
    let widget: React.Element<any> = (config.widget.show: any);
    element = React.cloneElement(widget, {
      key: toReactKey(config.valueKey),
      label: config.label,
      hint: config.hint,
      formValue: value,
      readOnly: true
    });
  } else {
    switch (config.type) {
      case "date":
        element = (
          <form.DateField
            key={toReactKey(config.valueKey)}
            label={config.label}
            hint={config.hint}
            formValue={value}
            readOnly={true}
          />
        );
        break;
      case "bool":
        element = (
          <form.CheckboxField
            key={toReactKey(config.valueKey)}
            label={config.label}
            hint={config.hint}
            formValue={value}
            readOnly={true}
          />
        );
        break;
      case "file":
        element = (
          <form.FileUploadField
            key={toReactKey(config.valueKey)}
            label={config.label}
            hint={config.hint}
            formValue={value}
            storage={config.storage}
            download={config.column}
            readOnly={true}
          />
        );
        break;
      case "enum":
        element = (
          <form.SelectField
            key={toReactKey(config.valueKey)}
            label={config.label}
            hint={config.hint}
            formValue={value}
            options={config.options || config.values}
            readOnly={true}
          />
        );
        break;
      case "integer":
        element = (
          <form.IntegerField
            key={toReactKey(config.valueKey)}
            label={config.label}
            hint={config.hint}
            formValue={value}
            readOnly={true}
          />
        );
        break;
      case "number":
        element = (
          <form.NumberField
            key={toReactKey(config.valueKey)}
            label={config.label}
            hint={config.hint}
            formValue={value}
            readOnly={true}
          />
        );
        break;
      case "calculation":
        element = (
          <form.ViewValue
            key={toReactKey(config.valueKey)}
            label={config.label}
            formValue={value}
          />
        );
        break;
      case "fieldset": {
        let fields = config.fields.map(f => {
          let nextValue = value.select(f.valueKey);
          return (
            <Field key={toReactKey(f.valueKey)} value={nextValue} config={f} />
          );
        });
        element = <mui.List>{fields}</mui.List>;
        break;
      }
      case "list": {
        invariant(
          Array.isArray(value.value) || value.value == null,
          "ConfView: expected an array for a list field config"
        );
        let values = value.value || [];
        let items = values.map((item, key) => {
          let valuePerItem = value.select(key);
          let fields = config.fields.map(f => {
            let valuePerField = valuePerItem.select(f.valueKey);
            return (
              <Field
                key={toReactKey(f.valueKey)}
                value={valuePerField}
                config={f}
              />
            );
          });
          return (
            <mui.Paper
              key={key}
              style={{
                marginBottom: theme.spacing.unit,
                padding: theme.spacing.unit
              }}
              square={true}
              elevation={1}
            >
              {fields}
            </mui.Paper>
          );
        });

        let labelElement = null;
        if (config.label != null) {
          labelElement = (
            <mui.InputLabel shrink={true} variant="standard">
              <div style={{ paddingBottom: theme.spacing.unit }}>
                {config.label}
              </div>
            </mui.InputLabel>
          );
        }

        element = (
          <div>
            {labelElement}
            {items}
          </div>
        );
        break;
      }
      default:
        element = (
          <form.ViewValue
            key={toReactKey(config.valueKey)}
            label={config.label}
            formValue={value}
          />
        );
        break;
    }
  }

  return element;
}
