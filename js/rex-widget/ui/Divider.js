/**
 * @copyright 2015-present Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as css from "rex-ui/css";

export default function Divider() {
  let style = {
    background: css.rgb(226),
    margin: 0,
    padding: 0,
    border: 0,
    height: 1
  };
  return <hr style={style} />;
}
