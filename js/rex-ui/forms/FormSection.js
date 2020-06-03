// @flow

import * as React from "react";
import * as mui from "@material-ui/core";
import * as Rapid from "../rapid";

type Props = {|
  label: string,
  children: React.Node,
  helperText?: ?string,
  elevation?: number,
|};

export function FormSection({
  label,
  helperText,
  children,
  elevation = 1,
}: Props) {
  let classes = useStyles();
  return (
    <mui.Paper elevation={elevation} className={classes.root}>
      <div className={classes.header}>
        <mui.FormLabel>{label}</mui.FormLabel>
        {helperText != null && (
          <mui.FormHelperText>{helperText}</mui.FormHelperText>
        )}
      </div>
      <div>{children}</div>
    </mui.Paper>
  );
}

let useStyles = Rapid.makeStyles(theme => ({
  root: {
    padding: theme.spacing.unit,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: theme.spacing.unit,
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
}));
