// @flow

import * as React from "react";
import classNames from "classnames";
import * as mui from "@material-ui/core";
import { makeStyles, ThemeProvider } from "@material-ui/styles";
import { Menu as MenuIcon } from "@material-ui/icons";
import { DARK_THEME, DEFAULT_THEME } from "rex-ui/rapid/themes";
import * as Router from "./Router.js";
import { isEmptyObject } from "rex-ui/rapid/helpers";

let drawerWidth = 240;
let appBarHeight = 64;

const useStyles = makeStyles(theme => {
  if (theme == null || isEmptyObject(theme)) {
    theme = DEFAULT_THEME;
  }

  return {
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
      height: "100vh",
      maxHeight: "100vh",
      paddingTop: appBarHeight,
      marginLeft: 0,
    },
    upperPartWrapper: {
      flex: "1 1 auto",
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
  };
});

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
  let [drawerOpen, setDrawerOpen] = React.useState(false);
  let [appTheme, setAppTheme] = React.useState<"default" | "custom">("default");
  let toggleDrawerOpen = () => {
    setDrawerOpen(open => !open);
  };
  let classes = useStyles();

  let theme = React.useMemo(() => {
    switch (appTheme) {
      case "custom": {
        return DARK_THEME;
      }
      case "default":
      default: {
        return DEFAULT_THEME;
      }
    }
  }, [appTheme]);

  return (
    <ThemeProvider theme={theme}>
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
        <div className={classes.upperPartWrapper}>
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
        </div>
        <AppTheme onChange={val => setAppTheme(val)} theme={appTheme} />
      </mui.Drawer>
      <main
        className={classNames(classes.content, {
          [classes.contentShift]: drawerOpen,
        })}
      >
        {children}
      </main>
    </ThemeProvider>
  );
}

type AppMenuProps = {|
  nav: Router.Navigation,
  menu: Router.Screen[],
|};

function AppMenu({ nav, menu }: AppMenuProps) {
  let items = menu.map((screen, index) => {
    let key = `${screen.type}-${screen.fetch}-${index}`;
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
  return (
    <mui.List>
      <mui.ListSubheader>Pages</mui.ListSubheader>
      {items}
    </mui.List>
  );
}

function AppTheme({
  onChange,
  theme,
}: {
  onChange: (newTheme: "default" | "custom") => void,
  theme: "default" | "custom",
}) {
  return (
    <mui.List>
      <mui.ListSubheader>Themes</mui.ListSubheader>
      <mui.ListItem
        button={true}
        selected={theme === "default"}
        onClick={() => onChange("default")}
      >
        <mui.ListItemText primary={"Default"} />
      </mui.ListItem>

      <mui.ListItem
        button={true}
        selected={theme === "custom"}
        onClick={() => onChange("custom")}
      >
        <mui.ListItemText primary={"Custom"} />
      </mui.ListItem>
    </mui.List>
  );
}
