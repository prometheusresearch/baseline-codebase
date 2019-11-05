/**
 * @flow
 */

import * as React from "react";

export let RenderValue = ({ value }: {| value: any |}) => {
  switch (value) {
    case undefined:
    case null: {
      return <span>—</span>;
    }
    case true: {
      return <span>Yes</span>;
    }
    case false: {
      return <span>No</span>;
    }
    default:
      return <span>{String(value)}</span>;
  }
};
