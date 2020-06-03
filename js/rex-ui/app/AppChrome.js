// @flow

import * as React from "react";
import cx from "classnames";
import * as mui from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import * as Layout from "rex-ui/Layout";
import * as Theme from "rex-ui/Theme";
import { AppDrawer, DRAWER_WIDTH } from "./AppDrawer";
import * as Route from "./Route";
import { Breadcrumbs } from "./Breadcrumbs";
import ScrollView from "../ScrollView.js";

let appBarHeight = 64;

type Props = {|
  title: string,
  children: React.Node,
  scrollableContent?: boolean,
|};

export default function AppChrome({
  title,
  children,
  scrollableContent = false,
}: Props) {
  let { routes, route, breadcrumbs } = Route.useRouteInfo();
  let layout = Layout.useLayoutMode();
  let classes = useStyles();

  let [isDrawerOpen, setIsDrawerOpen] = React.useState<boolean>(false);

  let toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // TODO(andreypopp): get rid of that
  React.useEffect(() => {
    if (document.body) {
      document.body.classList.add(classes.body);
    }
  }, [classes.body]);

  return (
    <>
      <mui.AppBar
        position="static"
        className={cx({
          [classes.AppChrome__appBar]: true,
          [classes.AppChrome__content_shifted]:
            layout !== "phone" && isDrawerOpen,
        })}
      >
        <mui.Toolbar>
          {!isDrawerOpen && (
            <mui.IconButton
              aria-label="Open drawer"
              onClick={toggleDrawer}
              className={cx(classes.AppChrome__drawerButton)}
            >
              <MenuIcon color="primary" />
            </mui.IconButton>
          )}
          <mui.Typography
            variant="h6"
            color="primary"
            noWrap
            className={classes.AppChrome__title}
          >
            {title}
          </mui.Typography>
          <mui.IconButton
            title="Logout"
            className={cx(classes.AppChrome__logoutButton)}
            href="/logout"
          >
            <ExitToAppIcon color="primary" />
          </mui.IconButton>
        </mui.Toolbar>
      </mui.AppBar>
      <AppDrawer
        routes={routes}
        route={route}
        open={isDrawerOpen}
        onClose={toggleDrawer}
      />
      <main
        className={cx({
          [classes.AppChrome__content]: true,
          [classes.AppChrome__content_shifted]:
            layout !== "phone" && isDrawerOpen,
        })}
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        {scrollableContent ? (
          <ScrollView>{children}</ScrollView>
        ) : (
          <div className={classes.AppChrome__noScrollableContent}>
            {children}
          </div>
        )}
      </main>
    </>
  );
}

const useStyles = Theme.makeStyles(theme => ({
  body: {
    margin: 0,
  },
  AppChrome__appBar: {
    height: appBarHeight,
    backgroundColor: "#FFFFFF",
  },
  AppChrome__title: {
    flexGrow: 1,
  },
  AppChrome__content: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    minWidth: 0, // So the Typography noWrap works
    height: `calc(100% - ${appBarHeight}px)`,
  },
  AppChrome__content_shifted: {
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    marginLeft: DRAWER_WIDTH,
  },
  AppChrome__noScrollableContent: {
    overflow: "hidden",
    flexGrow: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  AppChrome__drawerButton: {
    marginLeft: 0,
    marginRight: 12,
  },
  AppChrome__logoutButton: {
    marginLeft: 12,
    marginRight: 0,
  },
}));
