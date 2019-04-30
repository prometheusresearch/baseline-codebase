/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";

import { SourceCodeInput } from "./SourceCodeInput";
import * as SourceCodeField from "./SourceCodeField";

function jsonify(value) {
  if (typeof value === "string") {
    return value;
  } else if (value == null) {
    return "";
  } else {
    return JSON.stringify(value, null, 2);
  }
}

let Input = React.forwardRef(({ value, onChange, ...props }, ref) => {
  let jsonValue = React.useMemo(() => jsonify(value), [value]);
  return (
    <SourceCodeInput
      {...props}
      ref={ref}
      value={jsonValue}
      onChange={value => {
        if (!value) {
          value = null;
        }
        try {
          value = JSON.parse((value: any));
        } catch (_err) {}
        onChange(value);
      }}
    />
  );
});

type Props = SourceCodeField.Props;

export function JsonSourceCodeField(props: Props) {
  return (
    <SourceCodeField.SourceCodeField
      {...props}
      renderInput={props => <Input {...props} />}
      serializer={value => JSON.stringify(value, null, 2) || null}
    />
  );
}
