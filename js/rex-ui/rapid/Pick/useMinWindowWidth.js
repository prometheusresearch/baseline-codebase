// @flow

import * as React from "react";
import { useDebouncedCallback } from "../../useDebouncedCallback.js";

export function useMinWindowWidth(minWidth: number) {
  const [doesMatch, setDoesMatch] = React.useState(
    window.innerWidth >= minWidth,
  );

  const resizeHandler = useDebouncedCallback(
    128,
    () => {
      setDoesMatch(window.innerWidth >= minWidth);
    },
    [],
  );

  React.useEffect(() => {
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  });

  return doesMatch;
}
