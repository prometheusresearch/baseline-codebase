// @flow

import * as React from "react";
import { urlFor } from "./url.js";

export default function useBasename(packageName: string): string {
  let basename = React.useMemo(() => {
    let path = urlFor(`${packageName}:/`);
    path = path.slice(window.location.origin.length);
    return path;
  }, [packageName]);
  return basename;
}
