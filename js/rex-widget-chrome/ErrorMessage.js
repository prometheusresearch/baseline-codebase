/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import React from "react";

import * as styles from "@material-ui/styles";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import { useLayoutMode } from "rex-ui/Layout";

type Props = {
  onReload: () => void
};

let useStyles = styles.makeStyles({
  ErrorRoot: {
    display: "flex",
    backgroundColor: "#eceff1",
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  Title: {
    paddingBottom: 20
  },
  Inner: {
    boxSizing: "border-box",
    backgroundColor: "#ffebee !important",
    display: "flex",
    flexDirection: "column",
    padding: 30
  },
  Toolbar: {
    paddingTop: 30
  }
});

export default function ErrorMessage(props: Props) {
  let classes = useStyles();
  let layout = useLayoutMode();
  let shouldExpand = layout === "phone";
  return (
    <div className={classes.ErrorRoot}>
      <mui.Paper
        elevation={shouldExpand ? 0 : 1}
        square={shouldExpand}
        style={{
          maxWidth: shouldExpand ? undefined : 500,
          height: shouldExpand ? "100%" : undefined
        }}
        classes={{ root: classes.Inner }}
      >
        <mui.Typography
          color="error"
          variant="h5"
          classes={{ root: classes.Title }}
        >
          Application crashed... :-(
        </mui.Typography>
        <mui.Typography variant="subtitle1">
          This is a bug, please report it. In the mean time you either try
          reloading the page or navigate away.
        </mui.Typography>
        <div className={classes.Toolbar}>
          <mui.Button color="primary" onClick={props.onReload}>
            Reload
          </mui.Button>
        </div>
      </mui.Paper>
    </div>
  );
}
