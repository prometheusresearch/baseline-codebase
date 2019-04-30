/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import React from "react";

import NumberInput from "./NumberInput";
import { Field, type Props } from "./Field";

let renderInput = props => <NumberInput {...props} />;

export function NumberField(props: Props) {
  return <Field {...props} renderInput={renderInput} />;
}
