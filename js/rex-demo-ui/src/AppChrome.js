// @flow

import * as React from "react";
import classNames from "classnames";
import * as mui from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { Menu as MenuIcon } from "@material-ui/icons";
import * as Router from "./Router.js";

let drawerWidth = 240;
let appBarHeight = 64;

const useStyles = makeStyles(theme => ({
  appBar: {
    height: appBarHeight,
    backgroundColor: "#FFFFFF",
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  content: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    minWidth: 0, // So the Typography noWrap works
    transition: theme.transitions.create(["margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginTop: appBarHeight,
    marginLeft: 0,
  },
  contentShift: {
    transition: theme.transitions.create(["margin"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: `${drawerWidth}px !important`,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    paddingTop: theme.spacing.unit,
  },
  drawerMenuButton: {
    display: "flex",
    justifyContent: "flex-start",
    padding: theme.spacing.unit,
    ...theme.mixins.toolbar,
  },
  menuButton: {
    marginLeft: 0,
    marginRight: 12,
  },
}));

type AppChromeProps = {|
  nav: Router.Navigation,
  menu: Router.Screen[],
  title: string,
  children: React.Node,
|};

export default function AppChrome({
  title,
  children,
  nav,
  menu,
}: AppChromeProps) {
  let classes = useStyles();
  let [drawerOpen, setDrawerOpen] = React.useState(false);
  let toggleDrawerOpen = () => {
    setDrawerOpen(open => !open);
  };
  return (
    <>
      <mui.AppBar
        position="fixed"
        className={classNames(classes.appBar, {
          [classes.appBarShift]: drawerOpen,
        })}
      >
        <mui.Toolbar>
          {!drawerOpen && (
            <mui.IconButton
              aria-label="Open drawer"
              onClick={toggleDrawerOpen}
              className={classNames(classes.menuButton)}
            >
              <MenuIcon color="primary" />
            </mui.IconButton>
          )}
          <mui.Typography variant="h6" color="primary" noWrap>
            {title}
          </mui.Typography>
        </mui.Toolbar>
      </mui.AppBar>
      <mui.Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        className={classes.drawer}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.drawerMenuButton}>
          <mui.IconButton
            color="inherit"
            aria-label="Open drawer"
            onClick={toggleDrawerOpen}
          >
            <MenuIcon color="primary" />
          </mui.IconButton>
        </div>
        <AppMenu nav={nav} menu={menu} />
      </mui.Drawer>
      <main
        className={classNames(classes.content, {
          [classes.contentShift]: drawerOpen,
        })}
      >
        {children}
      </main>
    </>
  );
}

type AppMenuProps = {|
  nav: Router.Navigation,
  menu: Router.Screen[],
|};

function AppMenu({ nav, menu }: AppMenuProps) {
  let items = menu.map(screen => {
    let key = `${screen.type}-${screen.fetch}`;
    let selected = nav.isActive(screen);
    let onClick = () => nav.replace(screen);
    return (
      <mui.ListItem
        key={key}
        button={true}
        selected={selected}
        onClick={onClick}
      >
        <mui.ListItemText primary={screen.title} />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
}
