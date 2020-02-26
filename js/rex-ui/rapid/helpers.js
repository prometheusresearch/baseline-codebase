/**
 * @flow
 */
import * as React from "react";

export function capitalize(value: string) {
  if (value.length === 0) {
    return value;
  }
  return value[0].toUpperCase() + value.substring(1);
}

export const isEmptyObject = (obj: any) =>
  obj != null && typeof obj === "object" && Object.keys(obj).length === 0;

export function useDebouncedCallback<
  T: (...args: $ReadOnlyArray<empty>) => void | Promise<void>,
>(ms: number, cb: T, dependencies: $ReadOnlyArray<mixed>): T {
  let timer = React.useRef<?TimeoutID>(null);
  React.useEffect(
    () => () => {
      if (timer.current != null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    },
    [dependencies],
  );
  let cbWithDebounce: any = React.useCallback(
    (...args: $ReadOnlyArray<empty>) => {
      if (timer.current != null) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        cb(...args);
      }, ms);
    },
    [ms, cb],
  );
  return cbWithDebounce;
}
