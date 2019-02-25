/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import debounce from 'debounce';

export {debounce};

let uniqueIdNum = 0;

export function uniqueId(prefix?: string = 'id'): string {
  uniqueIdNum = uniqueIdNum + 1;
  return `${prefix}${uniqueIdNum}`;
}

export function noop(): void {}

export function chooseValue(
  nameMapping: Object,
  a?: string | number,
  b?: string | number,
  c?: string | number,
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
