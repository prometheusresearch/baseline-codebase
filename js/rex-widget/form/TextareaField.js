/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as Field from "./Field";
import ReadOnlyField from "./ReadOnlyField";

function renderInput({ value, error: _error, ...props }) {
  value = value || "";
  return <mui.Input {...props} value={value} multiline />;
}

type Props = Field.Props;

/**
 * Renders a <Field> with a <textarea>.
 */
export function TextareaField(props: Props) {
  return <Field.Field {...props} renderInput={renderInput} />;
}
