import type { Derivation } from "derivable";

declare module "react-forms" {
  declare type FormValue = {
    schema: any,
    errorList: Array<mixed>,
    completeErrorList: Array<mixed>,
    value: mixed,
    _value: Derivation<mixed>
  };
}

declare module "react-forms/reactive" {
  declare export function update(
    value: mixed,
    keyPath: Array<string | number> | string,
    update: mixed
  ): mixed;
}
