// @flow

import * as validator from "validator";
import { type Validation, valid, isValid } from "./State.js";

type Validate<I, O> = I => {| error: string |} | {| value: O |};

export let email: Validate<string, string> = (value: string) => {
  if (validator.isEmail(value)) {
    return { value };
  } else {
    return { error: "should be a valid email address" };
  }
};

export function validate<V>(val: Validate<V, any>, v: V): Validation {
  let res = val(v);
  if (res.error != null) {
    return { message: res.error, children: {} };
  }
  return valid;
}

export let boolean: Validate<mixed, boolean> = (value: mixed) => {
  if (typeof value !== "boolean") {
    return { error: "should be a boolean value" };
  }
  return { value };
};

export function array<T>(
  validate: T => Validation,
  array: Array<T>,
): Validation {
  let children = {};
  array.forEach((item, idx) => {
    let val = validate(item);
    if (!isValid(val)) {
      children[idx] = val;
    }
  });
  return {
    message: null,
    children: children,
  };
}

export function string(
  validate?: Validate<string, string>,
): Validate<mixed, string> {
  return value => {
    if (typeof value !== "string") {
      return { error: "should be a string" };
    }
    return validate ? validate(value) : { value };
  };
}

export function nonEmpty<V: string | Array<any>>(): Validate<V, V> {
  return value => {
    if (value != null && value?.length === 0) {
      return { error: "should not be empty" };
    }
    return { value };
  };
}

export function nullable(
  validate?: Validate<mixed, any>,
): Validate<mixed, any> {
  return value => {
    if (value == null || !validate) {
      return { value };
    }
    return validate(value);
  };
}

export function pattern(
  pattern: RegExp,
  errorMessage: string,
  validate?: Validate<string, string>,
): Validate<string, string> {
  return value => {
    let re = new RegExp(pattern);
    if (!re.exec(value)) {
      return { error: errorMessage };
    }
    return validate ? validate(value) : { value };
  };
}
