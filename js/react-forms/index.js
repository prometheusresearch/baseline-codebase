/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import withFormValue from "./withFormValue";
import * as Schema from "./Schema";

export {validate} from "./Schema";
export {update} from "./update";
export {default as Fieldset} from "./Fieldset";
export {Schema, withFormValue};
export {default as Input} from "./Input";
export {default as ErrorList} from "./ErrorList";
import {create as createValue} from "./Value";
export {createValue};
export {suppressUpdate, Value} from "./Value";
export {default as Field} from "./Field";
export {default as Component, useFormValue} from "./Component";
import type {select, value, error, schema, key, keypath} from "./types";
export type {select, value, error, schema, key, keypath};

export let useFormValueState = (
  params?: {value?: Object, schema?: schema, params?: Object} = {},
) => {
  let onChange = value => setValue(value);
  let [value, setValue] = React.useState(() =>
    createValue({
      schema: params.schema,
      value: params.value,
      onChange: onChange,
      params: params.params,
    }),
  );
  return value;
};
