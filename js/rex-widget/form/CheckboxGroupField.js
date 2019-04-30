/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { useFormValue, type value, type select } from "react-forms";
import { Element } from "react-stylesheet";
import { useFetch, type Fetcher } from "../data";
import * as rexui from "rex-ui";

import * as Field from "./Field";
import ReadOnlyField from "./ReadOnlyField";
import contextParams from "./contextParams";
import CheckboxGroup, {
  primitiveValueStrategy,
  entityValueStrategy,
  type Value,
  type Option,
  type ValueStrategy
} from "./CheckboxGroup";

function TitleList({
  value,
  options
}: {
  value: ?(Value[]),
  options: ?(Option[])
}) {
  if (options == null) {
    return null;
  } else {
    if (value != null) {
      options = options.filter(option => value.indexOf(option.id) > -1);
    }
    let titles = options.map(option => option.title);
    return <div>{titles.join(", ")}</div>;
  }
}

type Props = {|
  ...Field.Props,

  /**
   * If form field should operate on a plain list of ids rather than a list of
   * objects with id attribute.
   */
  plain?: boolean,

  /**
   * Fetcher for options.
   */
  options: Fetcher<Option[]>,

  noOptionsText?: string
|};

export function CheckboxGroupField({
  readOnly,
  label,
  hint,
  formValue: formValueOfProps,
  select,
  options: data,
  noOptionsText = "No Items",
  fetched,
  plain,
  ...props
}: Props) {
  let theme = rexui.useTheme();
  let formValue = useFormValue(formValueOfProps, select);
  let dataset = useFetch(data.params(contextParams(formValue.params.context)));
  let updating = dataset.updating;
  let options = dataset.data;
  let value: Value[] = formValue.value == null ? [] : (formValue.value: any);

  let renderValue = value => {
    return updating ? (
      <rexui.PreloaderScreen />
    ) : (
      <TitleList value={(value: any)} options={options} />
    );
  };

  let valueStrategy: ValueStrategy<any> = plain
    ? primitiveValueStrategy
    : entityValueStrategy;

  let renderInput = inputProps => {
    if (updating) {
      return <rexui.PreloaderScreen />;
    } else if (options == null || options.length === 0) {
      return (
        <Element padding={theme.spacing.unit * 2}>
          <mui.FormLabel filled>{noOptionsText}</mui.FormLabel>
        </Element>
      );
    } else {
      return (
        <CheckboxGroup
          {...inputProps}
          valueStrategy={valueStrategy}
          options={options != null ? options : []}
        />
      );
    }
  };

  let renderLabel = labelProps => {
    if (labelProps.label == null) {
      return null;
    }
    return (
      <mui.FormLabel
        filled={true}
        required={labelProps.required}
        error={labelProps.error}
        style={{ paddingBottom: theme.spacing.unit }}
      >
        {labelProps.label}
      </mui.FormLabel>
    );
  };

  return (
    <Field.Field
      {...props}
      label={label}
      hint={hint}
      formValue={formValue}
      renderInput={renderInput}
      renderLabel={renderLabel}
      renderValue={renderValue}
    />
  );
}
