/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow strict
 */

import React from "react";
import * as types from "./types";

let safeToString = msg => {
  if (typeof msg === "string") {
    return msg;
  } else {
    // $FlowFixMe: ...
    console.warning(msg);
    return JSON.stringify(msg);
  }
};

type Props = {
  error: types.error,
  label?: string,
  noLabel?: boolean,
  complete?: boolean,
};

export default function Error({error, label, noLabel, complete}: Props) {
  if (!error) {
    return <noscript />;
  }
  let labelElement = null;
  if (label != null && error.schema) {
    labelElement = error.schema.label;
  }
  if (labelElement != null && Boolean(complete) && !Boolean(noLabel)) {
    return (
      <div>
        {label}: {safeToString(error.message)}
      </div>
    );
  } else {
    return <div>{safeToString(error.message)}</div>;
  }
}
