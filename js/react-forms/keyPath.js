/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow strict
 */

import invariant from "invariant";
import type {keypath} from "./types";

const IS_NUMBER = /^[0-9]+$/;

function tryParseInt(v) {
  if (typeof v === "string" && IS_NUMBER.exec(v)) {
    return parseInt(v, 10);
  } else if (typeof v === "number" || typeof v === "string") {
    return v;
  } else {
    invariant(false, "invalid key in keypath: %s", v);
  }
}

export default function keyPath(value: number | string | keypath): keypath {
  if (Array.isArray(value)) {
    return (value: keypath);
  } else if (typeof value === "string") {
    if (value.indexOf(".") !== -1) {
      return value
        .split(".")
        .filter(v => Boolean(v))
        .map<string | number>(v => tryParseInt(v));
    } else {
      return [tryParseInt(value)];
    }
  } else if (typeof value === "number") {
    return [value];
  } else {
    invariant(
      false,
      "keyPath can be either an array, a string or a number, got: %s",
      value,
    );
  }
}
