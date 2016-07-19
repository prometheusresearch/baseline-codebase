/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import every from 'lodash/every';

export function isCompleteSimple(formValue, _discrepancy) {
  return (
    // !== undefined is important as we want to capture any intentional input
    // from user, even if it results in empty value (null)
    formValue.value !== undefined &&
    formValue.completeErrorList.length === 0
  );
}

export function isCompleteComposite(formValue, discrepancy) {
  let {value, completeErrorList} = formValue;
  return (
    value &&
    completeErrorList.length === 0 &&
    every(discrepancy, (_v, i) =>
      every(discrepancy[i], (_v, j) =>
        // !== undefined is important as we want to capture any intentional input
        // from user, even if it results in empty value (null)
        value[i] && value[i][j] !== undefined))
  );
}

export function isComplete(formValue, discrepancy) {
  let {value, completeErrorList, schema} = formValue;
  return (
    value &&
    completeErrorList.length === 0 &&
    every(discrepancy, (discrepancy, key) => {
      let node = schema.properties[key];
      switch (node.instrument.type.base) {
        case 'recordList':
        case 'matrix':
          return isCompleteComposite(formValue.select(key), discrepancy);
        default:
          return isCompleteSimple(formValue.select(key), discrepancy);
      }
    })
  );
}
