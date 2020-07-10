/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as rexui from "rex-ui";
import * as Field from "./Field";
import { ViewValue } from "./ViewValue";
import { SourceCodeInput } from "./SourceCodeInput";

function renderReadOnlyValue(serializer, value) {
  return (
    <pre style={{ fontSize: "12px" }}>
      {value != null ? serializer(value) : null}
    </pre>
  );
}

function serializerDefault(value: mixed) {
  return String(value);
}

export type Props = {|
  ...Field.Props,
  serializer?: mixed => React.Node,
|};

let renderInputDefault = props => <SourceCodeInput {...props} />;

export function SourceCodeField(props: Props) {
  let {
    serializer = serializerDefault,
    renderInput = renderInputDefault,
    ...fieldProps
  } = props;
  let theme = rexui.useTheme();
  let renderLabel = labelProps => {
    if (labelProps.label == null) {
      return null;
    }
    return (
      <mui.FormLabel
        filled={true}
        variant="standard"
        required={labelProps.required}
        error={labelProps.error}
        style={{ paddingBottom: theme.spacing() }}
      >
        {labelProps.label}
      </mui.FormLabel>
    );
  };
  return (
    <Field.Field
      {...fieldProps}
      renderInput={renderInput}
      renderValue={value => renderReadOnlyValue(serializer, value)}
      renderLabel={renderLabel}
    />
  );
}
