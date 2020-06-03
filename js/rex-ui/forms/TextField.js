/**
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { type Field, useField } from "./State.js";

export function TextField<V: { [name: string]: any }>({
  form,
  label,
  name,
  disabled,
  errorMessage,
}: {|
  form: Field<V>,
  name: $Keys<V>,
  label: string,
  disabled?: boolean,
  errorMessage?: ?string,
|}) {
  let field = useField(form, name);
  let value = field.useValue();
  return React.useMemo(() => {
    let onChange = ev => {
      let { value } = ev.target;
      field.update(_ => value);
      field.setIsDirty(true);
    };
    let onBlur = ev => {
      field.setIsDirty(true);
    };
    let error = errorMessage ?? value.errorMessage;
    if (!value.isDirty) {
      error = null;
    }
    return (
      <>
        <mui.TextField
          error={!!error}
          disabled={disabled}
          label={label}
          value={value.value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          margin="normal"
          variant="outlined"
          fullWidth
        />
        {error && <mui.FormHelperText error={true}>{error}</mui.FormHelperText>}
      </>
    );
  }, [value, field, disabled, label, errorMessage]);
}
