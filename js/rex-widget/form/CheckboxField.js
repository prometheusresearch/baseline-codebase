/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import * as mui from "@material-ui/core";
import { useFormValue, type value, type select } from "react-forms";
import * as Field from "./Field";
import Checkbox from "./Checkbox";
import {ViewValue} from "./ViewValue";

type Props = Field.Props;

export function CheckboxField(props: Props) {
  let { label, hint, readOnly, formValue, select, ...rest } = props;
  let renderValue = value => (value ? "Yes" : "No");
  // We handle readOnly here as we don't pass label to field component.
  if (readOnly) {
    return (
      <ViewValue
        formValue={formValue}
        select={select}
        label={label}
        hint={hint}
        renderValue={renderValue}
      />
    );
  }
  let renderInput = props => (
    <mui.FormControlLabel label={label} control={<Checkbox {...props} />} />
  );
  return (
    <Field.Field
      {...rest}
      formValue={formValue}
      select={select}
      label={label}
      label={null}
      hint={hint}
      renderInput={renderInput}
      renderValue={renderValue}
    />
  );
}
