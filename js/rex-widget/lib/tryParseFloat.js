/**
 * @copyright 2015, Prometheus Research, LLC
 */

const NUMBER_RE = /^\-?[0-9]+(\.[0-9]*)?$/;

export default function tryParseFloat(value) {
  let parsed = parseFloat(value, 10);
  if (isNaN(parsed) || !NUMBER_RE.exec(value)) {
    return value;
  } else {
    return parsed;
  }
}

