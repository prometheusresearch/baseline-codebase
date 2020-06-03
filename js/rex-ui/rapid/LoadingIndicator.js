/**
 * @flow
 */

import * as React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";

export const LoadingIndicator = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      padding: 16,
    }}
  >
    <CircularProgress />
  </div>
);
