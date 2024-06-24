/**
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { type Field, useField } from "./State.js";
import { FileUpload } from "../FileUpload";
import { makeStyles } from "@material-ui/styles";

export function FileUploadField<V: { [name: string]: any }>({
  form,
  label,
  helperText,
  buttonText,
  storage,
  name,
  disabled,
  downloadPath,
  ownerRecordID,
}: {|
  form: Field<V>,
  name: $Keys<V>,
  label: string,
  storage: string,
  helperText?: ?string,
  buttonText?: ?string,
  disabled?: boolean,
  downloadPath?: string,
  ownerRecordID?: ?string,
|}) {
  let classes = useStyles();
  let field = useField(form, name);
  let value = field.useValue();
  return React.useMemo(() => {
    let onChange = handler => {
      field.update(_ => handler);
    };
    return (
      <>
        <mui.FormControl fullWidth margin="normal" disabled={disabled}>
          {label != null && (
            <mui.InputLabel shrink={true}>{label}</mui.InputLabel>
          )}
          <div className={classes.control}>
            <FileUpload
              disabled={disabled}
              buttonText={buttonText ?? "Select File"}
              value={value.value}
              onChange={onChange}
              storage={storage}
              download={downloadPath}
              ownerRecordID={ownerRecordID}
            />
            {helperText && (
              <mui.FormHelperText component="div">
                {helperText}
              </mui.FormHelperText>
            )}
          </div>
        </mui.FormControl>
      </>
    );
  }, [
    value,
    field,
    disabled,
    buttonText,
    helperText,
    label,
    classes,
    downloadPath,
    ownerRecordID,
    storage,
  ]);
}

let useStyles = makeStyles(theme => ({
  control: {
    paddingTop: theme.spacing(3),
  },
}));
