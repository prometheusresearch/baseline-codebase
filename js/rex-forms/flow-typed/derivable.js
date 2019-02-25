// @flow

declare module 'derivable' {

  declare export type Derivation<T> = {
    get(): T;
    derive<N>(computation: (value: T) => N): Derivation<N>;
  };

  declare export function derivation<T>(thunk: () => T): Derivation<T>;
}
