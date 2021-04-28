// @flow

import * as React from "react";

import { makeStyles, type Theme } from "@material-ui/styles";
import * as mui from "@material-ui/core";
import { useLayoutMode } from "../../Layout";

type Props = {|
  title?: React.Node,
  description?: React.Node,
  sideBarRight?: React.Node,
  toolbar?: React.Node,
  searchBar?: React.Node,
|};

export const PickHeader = ({
  title,
  description,
  sideBarRight,
  toolbar,
  searchBar,
}: Props) => {
  const classes = useStyles();
  let layout = useLayoutMode();

  let topStyle = { flexDirection: layout !== "phone" ? "row" : "column" };
  let sideBarStyle = {
    justifyContent: layout !== "phone" ? "flex-end" : "flex-start",
  };

  return (
    <div className={classes.PickHeader__root}>
      <div className={classes.PickHeader__top} style={topStyle}>
        <div className={classes.PickHeader__typographyWrapper}>
          {title != null && (
            <mui.Typography
              variant={"h5"}
              className={classes.PickHeader__title}
            >
              {title}
            </mui.Typography>
          )}
          {description != null && (
            <mui.Typography variant={"caption"}>{description}</mui.Typography>
          )}
        </div>
        {(sideBarRight || searchBar) && (
          <div className={classes.PickHeader__sideBar} style={sideBarStyle}>
            {searchBar && (
              <div className={classes.PickHeader__searchBar}>{searchBar}</div>
            )}
            {sideBarRight && (
              <div className={classes.PickHeader__sideBarRight}>
                {sideBarRight}
              </div>
            )}
          </div>
        )}
      </div>
      {toolbar != null && (
        <div className={classes.PickHeader__toolbar}>{toolbar}</div>
      )}
    </div>
  );
};

let useStyles = makeStyles((theme: Theme) => ({
  PickHeader__root: {
    padding: theme.spacing.unit * 2,
  },
  PickHeader__top: {
    display: "flex",
  },
  PickHeader__toolbar: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: theme.spacing.unit,
  },
  PickHeader__title: {
    marginBottom: 8,
  },
  PickHeader__sideBar: {
    display: "flex",
    flexDirection: "row",
    height: 48,
    flex: 1,
  },
  PickHeader__searchBar: {
    flex: 1,
    maxWidth: 420,
  },
  PickHeader__sideBarRight: {
    marginLeft: 8,
  },
  PickHeader__typographyWrapper: {
    marginRight: 16,
    flex: "0 1 auto",
  },
}));
