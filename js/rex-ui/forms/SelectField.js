/**
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { type Field, useField } from "./State.js";

let useStyles = makeStyles(theme => ({
  placeholder: {
    color: theme.palette.grey[500],
  },
}));

export function SelectField<V: { [name: string]: any }>({
  form,
  label,
  name,
  disabled,
  values,
  placeholder,
  renderValue = defaultRenderValue,
}: {|
  form: Field<V>,
  name: $Keys<V>,
  label: string,
  disabled?: boolean,
  values: Array<string>,
  placeholder?: string,
  renderValue?: string => React.Node,
|}) {
  let field = useField(form, name);
  let value = field.useValue();
  let styles = useStyles();
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
    let id = label + "-select-field";
    return (
      <>
        <mui.FormControl fullWidth margin="normal" error={error}>
          <mui.InputLabel shrink htmlFor={id}>
            {label}
          </mui.InputLabel>
          <mui.Select
            disabled={disabled}
            value={value.value ?? "placeholderValue"}
            onChange={onChange}
            onBlur={onBlur}
            inputProps={{
              id,
            }}
          >
            <mui.MenuItem
              key="placeholderKey"
              value="placeholderValue"
              disabled
            >
              <span className={styles.placeholder}>
                {placeholder ?? "Select"}
              </span>
            </mui.MenuItem>
            {values.map(value => (
              <mui.MenuItem key={value} value={value}>
                {renderValue(value)}
              </mui.MenuItem>
            ))}
          </mui.Select>
        </mui.FormControl>
        {error && <mui.FormHelperText error={true}>{error}</mui.FormHelperText>}
      </>
    );
  }, [
    value,
    field,
    disabled,
    label,
    values,
    placeholder,
    styles.placeholder,
    renderValue,
  ]);
}

let defaultRenderValue = value => value;
