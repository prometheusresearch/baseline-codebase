/**
 * @flow
 */

import * as React from "react";

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
    // eslint-disable-next-line
    dependencies, //TODO(vladimir.khapalov): we need a better way to use dependencies here
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
