/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

const NUMBER_RE = /^\-?[0-9]+(\.[0-9]*)?$/;

export default function tryParseFloat(value: string): number | string {
  let parsed = parseFloat(value);
  if (isNaN(parsed) || !NUMBER_RE.exec(value)) {
    return value;
  } else {
    return parsed;
  }
}

