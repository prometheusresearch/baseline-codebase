/**
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { type Field, useField } from "./State.js";
import { DateInput } from "../DateInput2";

export function DateField<V: { [name: string]: any }>({
  form,
  label,
  helperText,
  name,
  disabled,
}: {|
  form: Field<V>,
  name: $Keys<V>,
  label: string,
  helperText?: ?string,
  disabled?: boolean,
|}) {
  let field = useField(form, name);
  let value = field.useValue();
  return React.useMemo(() => {
    let onChange = date => {
      field.update(_ => date);
    };
    return (
      <>
        <mui.FormControl fullWidth margin="normal" disabled={disabled}>
          <DateInput
            disabled={disabled}
            label={label}
            value={value.value}
            onChange={onChange}
          />
          {helperText && (
            <mui.FormHelperText component="div">
              {helperText}
            </mui.FormHelperText>
          )}
        </mui.FormControl>
      </>
    );
  }, [value, field, disabled, label, helperText]);
}
