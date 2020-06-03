/**
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { type Field, useField } from "./State.js";

export function CheckboxField<V: { [name: string]: any }>({
  form,
  label,
  helperText,
  name,
  disabled,
}: {|
  form: Field<?V>,
  name: $Keys<V>,
  label: string,
  helperText?: ?string,
  disabled?: boolean,
|}) {
  let field = useField(form, name);
  let value = field.useValue();
  return React.useMemo(() => {
    let onChange = ev => {
      let { checked } = ev.target;
      field.update(_ => checked);
    };
    return (
      <>
        <mui.FormControlLabel
          control={
            <>
              <mui.Checkbox
                checked={value.value ?? false}
                onChange={onChange}
                disabled={disabled}
              />
            </>
          }
          label={
            <>
              <div>{label}</div>
              {helperText && (
                <mui.FormHelperText component="div">
                  {helperText}
                </mui.FormHelperText>
              )}
            </>
          }
        />
      </>
    );
  }, [value, field, disabled, label, helperText]);
}
