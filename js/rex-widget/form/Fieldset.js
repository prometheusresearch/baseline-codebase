/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as rexui from "rex-ui";
import {
  Fieldset as FieldsetBase,
  useFormValue,
  type value,
  type select,
} from "react-forms";
import { VBox } from "react-stylesheet";
import { ErrorList } from "./ErrorList";

type Props = {
  label?: string,
  hint?: string,
  formValue?: value,
  select?: select,
  children: React.Node,
  Component?: React.AbstractComponent<{}>,
};

export function Fieldset({
  Component = ((VBox: any): React.AbstractComponent<{}>),
  label,
  hint,
  formValue: formValueOfProps,
  select,
  children,
}: Props) {
  let theme = rexui.useTheme();
  let formValue = useFormValue(formValueOfProps, select);
  let schema = formValue.schema;
  let isRequired = schema != null && schema.isRequired;

  let isError = formValue.errorList.length > 0;

  let labelElement = null;
  if (label != null) {
    labelElement = (
      <mui.FormLabel
        error={isError}
        required={isRequired}
        style={{ paddingBottom: theme.spacing() }}
      >
        {label}
      </mui.FormLabel>
    );
  }

  let hintElement = null;
  if (hint != null) {
    hintElement = (
      <mui.FormHelperText error={isError} variant="standard">
        {hint}
      </mui.FormHelperText>
    );
  }

  let errorElement = null;
  if (isError) {
    errorElement = (
      <div style={{ margin: "6px 0 7px" }}>
        <ErrorList errorList={formValue.errorList} />
      </div>
    );
  }

  return (
    <Component>
      {labelElement}
      <FieldsetBase formValue={formValue}>{children}</FieldsetBase>
      {hintElement}
      {errorElement}
    </Component>
  );
}
