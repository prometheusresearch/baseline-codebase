/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import React from "react";

import * as styles from "@material-ui/styles";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import { useLayoutMode } from "rex-ui/Layout.js";
import { type Menu } from "./NavMenu.js";
import VerticalNavMenu from "./VerticalNavMenu.js";
import HorizontalNavMenu from "./HorizontalNavMenu.js";
import * as History from 'rex-ui/History';

import resolveURL from "rex-widget/resolveURL";

let useStyles = styles.makeStyles({
  HeaderRoot: {},
  HeaderApplicationTitle: {
    paddingRight: 10
  },
  HeaderApplicationNavMenu: {
    display: "flex",
    flexGrow: 1
  },
  HeaderApplicationMenuButton: {
    paddingRight: 10
  },

  ApplicationTitleRoot: {
    textTransform: "none",
    alignItems: "baseline"
  },
  ApplicationTitleBanner: {
    paddingLeft: 5
  },

  UserProfileButtonIcon: {
    // TODO: get padding from theme
    paddingRight: 5
  },
  UserProfileButtonRoot: {
    textTransform: "none !important"
  }
});

let ApplicationTitle = props => {
  let classes = useStyles();
  return (
    <mui.Button
      href={props.href}
      classes={{ label: classes.ApplicationTitleRoot }}
      color="inherit"
    >
      <mui.Typography color="inherit" variant="h6" display="inline" noWrap>
        {props.title}
      </mui.Typography>
      {props.banner && (
        <mui.Typography
          noWrap
          display="inline"
          variant="h6"
          color="inherit"
          classes={{ root: classes.ApplicationTitleBanner }}
        >
          | {props.banner}
        </mui.Typography>
      )}
    </mui.Button>
  );
};

let UserProfileButton = props => {
  let classes = useStyles();
  return (
    <mui.Button
      classes={{ root: classes.UserProfileButtonRoot }}
      color="inherit"
      href={props.href}
      size="small"
    >
      <icons.AccountCircle className={classes.UserProfileButtonIcon} />
      {props.username}
    </mui.Button>
  );
};

let LogoutButton = props => {
  let classes = useStyles();
  return (
    <mui.IconButton color="inherit" size="small" href={props.href}>
      <icons.ExitToApp />
    </mui.IconButton>
  );
};

type Props = {
  title: string,
  username: string,
  userProfileUrl: string,
  applicationBanner: string,
  applicationTitle: string,
  applicationLogoutUrl: string,
  menu: Menu,
  siteRoot: string,
  location: History.Location
};

let Header = (props: Props) => {
  let {
    menu,
    username,
    userProfileUrl,
    applicationBanner,
    applicationTitle,
    applicationLogoutUrl,
    siteRoot,
    location
  } = props;

  let layoutMode = useLayoutMode();
  let useDrawerForNavigation = layoutMode !== "desktop";

  let classes = useStyles();

  let [isDrawerOpen, setDrawerOpen] = React.useState(false);
  let openDrawer = () => setDrawerOpen(true);
  let closeDrawer = () => setDrawerOpen(false);

  return (
    <div className={classes.HeaderRoot}>
      <mui.AppBar position="static">
        <mui.Toolbar>
          {useDrawerForNavigation && (
            <>
              <mui.IconButton
                className={classes.HeaderApplicationMenuButton}
                color="inherit"
                aria-label="Menu"
                onClick={openDrawer}
              >
                <icons.Menu />
              </mui.IconButton>
              <mui.SwipeableDrawer
                open={isDrawerOpen}
                onClose={closeDrawer}
                onOpen={openDrawer}
              >
                <VerticalNavMenu menu={menu} location={location} />
              </mui.SwipeableDrawer>
            </>
          )}

          <div className={classes.HeaderApplicationTitle}>
            <ApplicationTitle
              title={applicationTitle}
              banner={applicationBanner}
              href={resolveURL(siteRoot)}
            />
          </div>
          <div className={classes.HeaderApplicationNavMenu}>
            {!useDrawerForNavigation && (
              <HorizontalNavMenu location={location} menu={menu} />
            )}
          </div>
          {userProfileUrl && (
            <UserProfileButton
              href={resolveURL(userProfileUrl)}
              username={username}
            />
          )}
          {applicationLogoutUrl && (
            <LogoutButton href={resolveURL(applicationLogoutUrl)} />
          )}
        </mui.Toolbar>
      </mui.AppBar>
    </div>
  );
};

export default Header;
