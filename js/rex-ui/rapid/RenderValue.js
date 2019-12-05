/**
 * @flow
 */

import * as React from "react";

export let RenderValue = ({ value }: {| value: any |}) => {
  switch (value) {
    case undefined:
    case null: {
      return "—";
    }
    case true: {
      return "Yes";
    }
    case false: {
      return "No";
    }
    default:
      return String(value);
  }
};
