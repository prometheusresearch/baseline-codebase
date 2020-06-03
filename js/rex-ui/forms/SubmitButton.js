// @flow

import * as React from "react";
import { type Field, isValid } from "./State.js";
import * as mui from "@material-ui/core";

type Props<V> = {|
  form: Field<V>,
  onSubmit: (?V) => any,
  label?: string,
  variant?: mui.ButtonVariants,
  forceDisabled?: boolean,
  allowInvalidSubmissions?: boolean,
|};

export function SubmitButton<V>(props: Props<V>) {
  let {
    label = "Submit",
    form,
    onSubmit,
    variant,
    allowInvalidSubmissions = false,
    forceDisabled = false,
  } = props;
  let value = form.useValue();
  let hasErrors = !isValid(value.validation);
  let handleSubmit = () => {
    if (!hasErrors || allowInvalidSubmissions) {
      onSubmit(value.value);
    } else {
      form.setIsDirty(true);
    }
  };
  return (
    <mui.Button
      color="primary"
      variant={variant}
      disabled={forceDisabled || (hasErrors && value.isDirty)}
      size="small"
      onClick={handleSubmit}
    >
      {label}
    </mui.Button>
  );
}
