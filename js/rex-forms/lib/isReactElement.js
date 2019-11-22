/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";

const _REACT_ELEMENT_TYPE = React.createElement("div").$$typeof;

export default function isReactElement(obj) {
  return obj && obj.$$typeof === _REACT_ELEMENT_TYPE;
}
