/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

const NUMBER_RE = /^\-?[0-9]+?$/;

export default function tryParseInt(value: string): string | number {
  let parsed = parseInt(value, 10);
  return isNaN(parsed) || !NUMBER_RE.exec(value) ? value : parsed;
}
