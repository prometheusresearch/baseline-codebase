/**
 * @flow
 */

import * as React from "react";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import WarningIcon from "@material-ui/icons/Warning";

const style = {
  padding: 24
};

const iconWrapperStyle = {
  paddingRight: 8,
  display: "inline-block",
  verticalAlign: "middle",
  marginTop: 8
};

export const ComponentError = ({ message }: { message: ?string }) => (
  <Grid container spacing={16}>
    <Grid item xs={12}>
      <Paper>
        <div style={style}>
          <Typography variant={"h6"}>
            <span style={iconWrapperStyle}>
              <WarningIcon />
            </span>
            Error: {`${message || ""}`}
          </Typography>
        </div>
      </Paper>
    </Grid>
  </Grid>
);
