// @flow

import * as React from "react";
import * as mui from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import * as Theme from "rex-ui/Theme";
import * as Layout from "rex-ui/Layout";

import AppMenu from "./AppMenu";
import * as Route from "./Route";

export const DRAWER_WIDTH = 240;

let useAppDrawerStyles = Theme.makeStyles(theme => {
  return {
    root: {
      flexShrink: 0,
    },
    wrapper: {
      flex: "1 1 auto",
    },
    toolbar: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-end",
      padding: theme.spacing(),
      ...theme.mixins.toolbar,
    },
    buttonClose: {
      height: 48,
    },
  };
});

type AppDrawerProps = {|
  open: boolean,
  onClose: () => void,
  routes: Route.RouteWithPosition[],
  route: Route.RouteWithPosition,
|};

export function AppDrawer({ open, onClose, routes, route }: AppDrawerProps) {
  let layout = Layout.useLayoutMode();
  let classes = useAppDrawerStyles();
  let style = { width: layout !== "phone" ? DRAWER_WIDTH : "100%" };
  let onNavigate = () => {
    if (layout === "phone") {
      onClose();
    }
  };
  return (
    <mui.Drawer
      variant={layout !== "phone" ? "persistent" : "temporary"}
      anchor="left"
      open={open}
      transitionDuration={0}
      style={style}
      PaperProps={{ style }}
      className={classes.root}
    >
      <div className={classes.wrapper}>
        <div className={classes.toolbar}>
          <mui.IconButton
            color="inherit"
            aria-label="Close drawer"
            onClick={onClose}
            className={classes.buttonClose}
          >
            <ClearIcon color="primary" />
          </mui.IconButton>
        </div>
        <AppMenu routes={routes} route={route} onNavigate={onNavigate} />
      </div>
    </mui.Drawer>
  );
}
