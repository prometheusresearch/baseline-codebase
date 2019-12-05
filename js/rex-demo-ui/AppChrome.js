// @flow

import * as React from "react";
import classNames from "classnames";
import * as mui from "@material-ui/core";
import { ThemeProvider, useTheme } from "@material-ui/styles";
import MenuIcon from "@material-ui/icons/Menu";
import ClearIcon from "@material-ui/icons/Clear";
import { DARK_THEME, DEFAULT_THEME } from "rex-ui/rapid/themes";
import * as Router from "rex-ui/Router";
import * as Layout from "rex-ui/Layout";
import * as Theme from "rex-ui/Theme";

let drawerWidth = 240;
let appBarHeight = 64;

const useStyles = Theme.makeStyles(theme => ({
  appBar: {
    height: appBarHeight,
    backgroundColor: "#FFFFFF",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    minWidth: 0, // So the Typography noWrap works
    height: "100vh",
    maxHeight: "100vh",
    paddingTop: appBarHeight,
    margin: 0,
  },
  menuButton: {
    marginLeft: 0,
    marginRight: 12,
  },
  shift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
}));

type AppChromeProps = {|
  router: Router.Router,
  menu?: Router.Route[],
  title: string,
  children: React.Node,
|};

type AppChromeContentProps = {|
  ...AppChromeProps,
  appTheme: "default" | "custom",
  setAppTheme: (newTheme: "default" | "custom") => void,
|};

function AppChromeContent({
  title,
  children,
  router,
  menu,
  appTheme,
  setAppTheme,
}: AppChromeContentProps) {
  let [drawerOpen, setDrawerOpen] = React.useState(false);

  let toggleDrawerOpen = () => {
    setDrawerOpen(open => !open);
  };
  let layout = Layout.useLayoutMode();
  let classes = useStyles();
  let theme = useTheme();

  return (
    <mui.MuiThemeProvider theme={theme}>
      <mui.AppBar
        position="fixed"
        className={classNames(classes.appBar, {
          [classes.shift]: layout !== "phone" && drawerOpen,
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
      <AppDrawer
        open={drawerOpen}
        onClose={toggleDrawerOpen}
        menu={menu}
        router={router}
        theme={appTheme}
        onTheme={setAppTheme}
      />
      <main
        className={classNames(classes.content, {
          [classes.shift]: layout !== "phone" && drawerOpen,
        })}
      >
        {children}
      </main>
    </mui.MuiThemeProvider>
  );
}

export default function AppChrome({
  title,
  children,
  router,
  menu,
}: AppChromeProps) {
  let [appTheme, setAppTheme] = React.useState<"default" | "custom">("default");
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
      <AppChromeContent
        title={title}
        router={router}
        menu={menu}
        appTheme={appTheme}
        setAppTheme={setAppTheme}
      >
        {children}
      </AppChromeContent>
    </ThemeProvider>
  );
}

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
      padding: theme.spacing.unit,
      ...theme.mixins.toolbar,
    },
  };
});

type AppDrawerProps = {|
  open: boolean,
  onClose: () => void,
  theme: any,
  onTheme: any => void,
  router: Router.Router,
  menu?: Router.Route[],
|};

function AppDrawer({
  router,
  open,
  onClose,
  menu,
  theme,
  onTheme,
}: AppDrawerProps) {
  let layout = Layout.useLayoutMode();
  let classes = useAppDrawerStyles();
  let style = { width: layout !== "phone" ? drawerWidth : "100%" };
  let onNavigate = () => {
    if (layout === "phone") {
      onClose();
    }
  };
  return (
    <mui.Drawer
      variant="persistent"
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
          >
            <ClearIcon color="primary" />
          </mui.IconButton>
        </div>
        <AppMenu router={router} menu={menu} onNavigate={onNavigate} />
      </div>
      <AppTheme onChange={onTheme} theme={theme} />
    </mui.Drawer>
  );
}

type AppMenuProps = {|
  router: Router.Router,
  menu?: Router.Route[],
  onNavigate: () => void,
|};

function AppMenu({ router, menu = router.routes, onNavigate }: AppMenuProps) {
  let items = menu.map((route, index) => {
    let key = route.path;
    let title = route.screen.title;
    let selected = router.isActive(route);
    let onClick = () => {
      router.replace(route);
      onNavigate();
    };
    return (
      <mui.ListItem
        key={`${key}+${index}`}
        button={true}
        selected={selected}
        onClick={onClick}
      >
        <mui.ListItemText primary={title} />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
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
