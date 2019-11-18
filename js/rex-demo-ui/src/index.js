// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import { Pick, Show, LoadingIndicator } from "rex-ui/rapid";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import * as mui from "@material-ui/core";
import { ThemeProvider, makeStyles } from "@material-ui/styles";
import { DEFAULT_THEME } from "rex-ui/rapid/themes";
import * as Router from "./Router.js";
import AppChrome from "./AppChrome.js";

let endpoint = RexGraphQL.configure("/_api/graphql");

const CustomSortRenderer = ({ value, values, onChange }) => {
  return <mui.FormLabel>{String(value)}</mui.FormLabel>;
};

let phoneField = {
  title: "Phone",
  require: {
    field: "phone",
    require: [{ field: "value" }],
  },
  render({ value }) {
    return value != null ? <div>tel: {value.value}</div> : "—";
  },
};

let pickUser: Router.PickScreen = {
  type: "pick",
  fetch: "user.paginated",
  title: "Users",
  description: "List of users",
  fields: [
    { require: { field: "remote_user" } },
    phoneField,
    "expired",
    { require: { field: "system_admin" } },
  ],
  filters: [
    {
      name: "search",
      render: ({ value, onChange }) => {
        return (
          <input value={value} onChange={ev => onChange(ev.target.value)} />
        );
      },
    },
    "expired",
    {
      name: "sort",
      render: CustomSortRenderer,
    },
  ],
  onSelect: id => ({
    type: "show",
    fetch: "user.get",
    id: id,
    fields: [
      { title: "Remote User", require: { field: "remote_user" } },
      "system_admin",
      "expired",
      {
        title: "Contact Info",
        require: {
          field: "contact_info",
          require: [{ field: "id" }, { field: "type" }, { field: "value" }],
        },
        render: ({ value }) => JSON.stringify(value),
      },
    ],
  }),
};

let pickPatient: Router.PickScreen = {
  type: "pick",
  fetch: "patient.paginated",
  title: "Patients",
  description: "List of patients",
};

const drawerWidth = 240;

const useStyles = makeStyles(theme => (console.log(theme),{
  buttonActive: {
    background: "rgba(0,0,0,0.15)",
  },
  appBar: {
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

function NavButton({ screen, nav, replace }) {
  const classes = useStyles();
  let onClick = () => {
    if (replace) {
      nav.replace(screen);
    } else {
      nav.push(screen);
    }
  };
  return (
    <Button
      className={
        Router.eqScreen(screen, nav.screen) ? classes.buttonActive : null
      }
      onClick={onClick}
    >
      {screen.title}
    </Button>
  );
}

function App() {
  let nav = Router.useNavigation(pickUser);

  let renderPickView = React.useCallback((screen: Router.PickScreen) => {
    let onRowClick;
    if (screen.onSelect != null) {
      let onSelect = screen.onSelect;
      onRowClick = (row: any) => nav.push(onSelect(row.id));
    }

    return (
      <Pick
        endpoint={endpoint}
        fetch={screen.fetch}
        onRowClick={onRowClick}
        fields={screen.fields}
        filters={screen.filters}
        title={screen.title}
        description={screen.description}
      />
    );
  }, []);

  let renderShowView = React.useCallback((screen: Router.ShowScreen) => {
    let onBack = () => {
      nav.pop();
    };
    return (
      <mui.Grid container style={{ padding: 8 }}>
        <mui.Grid item xs={12} sm={6} md={3}>
          <div>
            <Button onClick={onBack}>Back</Button>
          </div>
          <Show
            endpoint={endpoint}
            fetch={screen.fetch}
            args={{ id: screen.id }}
            fields={screen.fields}
          />
        </mui.Grid>
      </mui.Grid>
    );
  }, []);

  let ui = React.useMemo(() => {
    switch (nav.screen.type) {
      case "show":
        return renderShowView(nav.screen);
      case "pick":
        return renderPickView(nav.screen);
      default: {
        (nav.screen.type: empty); // eslint-disable-line
        throw new Error(`Unknown screen: ${nav.screen.type}`);
      }
    }
  }, [nav.screen]);

  return (
    <AppChrome title="Rex Rapid Demo">
      <mui.Grid container style={{ padding: 8 }}>
        <mui.Grid item xs={12} sm={6} md={3}>
          <div>
            <mui.Typography style={{ padding: 8 }}>Views:</mui.Typography>
          </div>
          <div style={{ marginBottom: 8 }}>
            <NavButton screen={pickUser} nav={nav} replace />
            <NavButton screen={pickPatient} nav={nav} replace />
          </div>
        </mui.Grid>
      </mui.Grid>
      <React.Suspense fallback={<LoadingIndicator />}>{ui}</React.Suspense>,
    </AppChrome>
  );
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(
  <>
    <ThemeProvider theme={DEFAULT_THEME}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </>,
  root,
);
