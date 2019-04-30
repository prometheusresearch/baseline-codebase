/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow strict
 */

import * as React from "react";
import * as types from "./types";

type Props = {
  schema?: types.schema,
  label?: string,
};

function Label({schema, label}: Props) {
  let labelElement = null;

  if (label != null) {
    labelElement = label;
  } else if (schema != null && schema.label != null) {
    labelElement = schema.label;
  }

  return labelElement != null ? <label>{labelElement}</label> : null;
}

export default Label;
