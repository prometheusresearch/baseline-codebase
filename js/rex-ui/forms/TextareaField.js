/**
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { type Field, useField } from "./State.js";

export function TextareaField<V: { [name: string]: any }>({
  form,
  label,
  name,
  disabled,
  rows,
  rowsMax,
  autogrow,
  variant,
}: {|
  form: Field<V>,
  name: $Keys<V>,
  label: string,
  disabled?: boolean,
  rows?: number,
  rowsMax?: number,
  autogrow?: boolean,
  variant?: "outlined" | "standart" | "filled",
|}) {
  let field = useField(form, name);
  let value = field.useValue();
  return React.useMemo(() => {
    let onChange = ev => {
      let { value } = ev.target;
      field.setIsDirty(true);
      field.update(_ => value);
    };
    let onBlur = ev => {
      field.setIsDirty(true);
    };
    let error = value.errorMessage;
    if (!value.isDirty) {
      error = null;
    }
    return (
      <>
        <mui.TextField
          error={error}
          disabled={disabled}
          label={label}
          value={value.value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          margin="normal"
          variant={variant}
          fullWidth
          multiline
          rows={rows}
          rowsMax={rows && autogrow ? rowsMax ?? -1 : rowsMax}
          InputLabelProps={{ shrink: true }}
        />
        {error && <mui.FormHelperText error={true}>{error}</mui.FormHelperText>}
      </>
    );
  }, [value, field, disabled, label, rows, rowsMax, autogrow, variant]);
}
