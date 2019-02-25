/**
 * @copyright 2015, Prometheus Research, LLC
 */

const NUMBER_RE = /^\-?[0-9]+?$/;

export default function tryParseInt(value) {
  let parsed = parseInt(value, 10);
  return isNaN(parsed) || !NUMBER_RE.exec(value) ?
    value : parsed;
}

