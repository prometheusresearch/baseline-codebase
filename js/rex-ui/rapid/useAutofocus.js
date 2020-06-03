// @flow

import * as React from "react";

export function useAutofocus(ref: any) {
  React.useLayoutEffect(() => {
    if (ref.current != null) {
      let node = (ref.current: any);
      node?.focus?.(); // eslint-disable-line no-unused-expressions
      node?.select?.(); // eslint-disable-line no-unused-expressions
    }
  }, [ref]);
}
