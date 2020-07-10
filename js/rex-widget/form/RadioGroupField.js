/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { useFormValue, type value, type select } from "react-forms";
import { useFetch, type Fetcher } from "../data";
import * as Field from "./Field";
import ReadOnlyField from "./ReadOnlyField";
import RadioGroup, { type Option, type Id } from "./RadioGroup";
import contextParams from "./contextParams";
import * as rexui from "rex-ui";

function Title({ value, options }) {
  if (value === null) {
    return null;
  }
  for (let i = 0; i < options.length; i++) {
    if (options[i].id === value) {
      return <span>{options[i].title}</span>;
    }
  }
  return null;
}

type Props = {|
  ...Field.Props,

  /**
   * Either an array of options or a producible which returns a list of
   * objects with `id` and `title` attributes.
   */
  options: Fetcher<Option[]>,
|};

function RadioGroupField({
  formValue: formValueOfProps,
  select,
  options: data,
  ...props
}: Props) {
  let theme = rexui.useTheme();
  let formValue = useFormValue(formValueOfProps, select);
  let dataset = useFetch(data.params(contextParams(formValue.params.context)));

  let updating = dataset.updating;
  let options = dataset.data != null ? dataset.data : [];

  let renderValue = value => {
    return updating ? (
      <rexui.PreloaderScreen style={{ marginTop: 9 }} />
    ) : (
      <Title value={formValue.value} options={options} />
    );
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
        style={{ paddingBottom: theme.spacing() }}
      >
        {labelProps.label}
      </mui.FormLabel>
    );
  };
  let renderInput = inputProps => {
    if (updating) {
      return <rexui.PreloaderScreen style={{ marginTop: theme.spacing() }} />;
    } else {
      return <RadioGroup {...inputProps} options={options} />;
    }
  };
  return (
    <Field.Field
      {...props}
      formValue={formValue}
      renderLabel={renderLabel}
      renderInput={renderInput}
      renderValue={renderValue}
    />
  );
}

export default RadioGroupField;
