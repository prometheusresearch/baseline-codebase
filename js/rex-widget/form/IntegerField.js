/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import Field, { type Props } from "./Field";
import IntegerInput from "./IntegerInput";

let renderInput = props => <IntegerInput {...props} />;

export function IntegerField(props: Props) {
  return <Field {...props} renderInput={renderInput} />;
}
