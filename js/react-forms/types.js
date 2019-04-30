/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow strict
 */

export type key = string | number;
export type keypath = key[];
export type select = key[] | key | true | null | void;

export type schema = {
  type: string,
  isRequired?: boolean,
  label?: ?string,
  defaultItem?: ?mixed,
  minItems?: number,
  maxItems?: number,
};

export type error = {
  message: string,
  field: string,
  force: boolean,
  schema?: schema,
};

export type value = {
  parent: value,
  root: value,

  keyPath: keypath,
  value: mixed,
  schema?: schema,

  errorList: error[],
  completeErrorList: error[],

  removeError: (error, suppressUpdate?: boolean) => value,
  addError: (error, suppressUpdate?: boolean) => value,

  params: {forceShowErrors: boolean, context?: {}},
  updateParams: (newParams: mixed, suppressUpdate?: boolean) => value,

  select: (select: select) => value,
  update: (newValue: mixed, suppressUpdate?: boolean) => void,

  setSchema: (schema: ?schema) => value,
  createRoot: mixed => value,
};
