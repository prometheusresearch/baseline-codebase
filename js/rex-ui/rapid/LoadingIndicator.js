/**
 * @flow
 */

import * as React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";

export const LoadingIndicator = () => (
  <div
    style={{
      display: "block",
      width: "100%",
      padding: 16,
      textAlign: "center"
    }}
  >
    <CircularProgress />
  </div>
);
