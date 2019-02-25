/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

/**
 * Extract value from event.
 */
export function extractValueFromEvent(event: UIEvent): mixed {
  let value;
  if (event && event.target && 'value' in event.target) {
    // $FlowIssue: ...
    value = event.target.value;
    if (value === '') {
      value = null;
    }
  } else {
    value = event;
  }
  return value;
}

const NUMBER_RE = /^\-?(([0-9]+(\.[0-9]*)?)|(\.[0-9]+))$/;

/**
 * Try parse number value out of string.
 */
export function tryParseNumber(value: string): string | number {
  let parsed = parseFloat(value, 10);
  if (isNaN(parsed) || !NUMBER_RE.exec(value)) {
    return value;
  } else {
    return parsed;
  }
}

const INTEGER_RE = /^\-?[0-9]+?$/;

/**
 * Try parse integer number value out of string.
 */
export function tryParseInteger(value: string): string | number {
  let parsed = parseInt(value, 10);
  return isNaN(parsed) || !INTEGER_RE.exec(value) ? value : parsed;
}
