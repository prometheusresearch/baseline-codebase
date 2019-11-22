/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";

type Props = {};

let useStyles = styles.makeStyles(theme => ({
  root: {
    display: "flex",
    width: "100%",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center"
  }
}));

let PreloaderScreen = (props: Props) => {
  let classes = useStyles();
  return (
    <div className={classes.root}>
      <mui.CircularProgress />
    </div>
  );
};

export default PreloaderScreen;
