/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as css from "rex-ui/css";

export default function Label() {
  let style = {
    fontSize: "85%",
    fontWeight: 700,
    color: css.rgb(170)
  };
  return <div style={style} />;
}
