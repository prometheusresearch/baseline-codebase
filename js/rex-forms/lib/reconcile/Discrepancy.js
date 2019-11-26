/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type { value } from "react-forms";
import * as types from "../types.js";
import every from "lodash/every";

export function isCompleteSimple(
  formValue: types.FormValue,
  _discrepancy: types.Discrepancy,
) {
  return (
    // !== undefined is important as we want to capture any intentional input
    // from user, even if it results in empty value (null)
    formValue.value !== undefined && formValue.completeErrorList.length === 0
  );
}

export function isCompleteComposite(
  formValue: types.FormValue,
  discrepancy: types.Discrepancy,
) {
  let { value, completeErrorList } = formValue;
  return (
    !!value &&
    completeErrorList.length === 0 &&
    every(discrepancy, (_v, i) =>
      every(discrepancy[i], (_v, j) => {
        // !== undefined is important as we want to capture any intentional input
        // from user, even if it results in empty value (null)
        let v: any = value;
        return j === "_NEEDS_VALUE_" || (v[i] && v[i][j] !== undefined);
      }),
    )
  );
}

export function isComplete(
  formValue: types.FormValue,
  discrepancy: types.Discrepancy,
) {
  let { value, completeErrorList, schema } = formValue;
  return (
    !!value &&
    completeErrorList.length === 0 &&
    every(discrepancy, (discrepancy, key) => {
      let node = (schema: any).properties[key];
      switch (node.instrument.type.base) {
        case "recordList":
        case "matrix":
          return isCompleteComposite(formValue.select(key), discrepancy);
        default:
          return isCompleteSimple(formValue.select(key), discrepancy);
      }
    })
  );
}
