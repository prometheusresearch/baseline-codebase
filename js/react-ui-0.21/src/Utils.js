/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

export function chooseValue(
  nameMapping: Object,
  a?: string | number,
  b?: string | number,
  c?: string | number
): void | string | number {

  let val;
  if (a !== undefined) {
    val = a;
  } else if (b !== undefined) {
    val = b;
  } else if (c !== undefined) {
    val = c;
  } else {
    return undefined;
  }

  if (nameMapping[val] != null) {
    return nameMapping[val];
  } else {
    return val;
  }
}
