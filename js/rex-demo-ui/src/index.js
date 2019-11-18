// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import { Pick, Show, LoadingIndicator } from "rex-ui/rapid";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import { Grid, Typography, FormLabel } from "@material-ui/core";
import { ThemeProvider, makeStyles } from "@material-ui/styles";
import { DEFAULT_THEME, DARK_THEME } from "rex-ui/rapid/themes";
import * as Router from "./Router";

let endpoint = RexGraphQL.configure("/_api/graphql");

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

const useStyles = makeStyles(theme => ({
  buttonActive: {
    background: "rgba(0,0,0,0.15)",
  },
}));

const CustomSortRenderer = ({ value, values, onChange }) => {
  return <FormLabel>{String(value)}</FormLabel>;
};

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
  const classes = useStyles();

  let nav = Router.useNavigation(pickUser);

  let [appTheme, setTheme] = React.useState<"default" | "dark">("default");
  let theme = React.useMemo(() => {
    switch (appTheme) {
      case "dark": {
        return DARK_THEME;
      }
      case "default":
      default: {
        return DEFAULT_THEME;
      }
    }
  }, [appTheme]);

  let [pickFiltersState, setPickFiltersState] = React.useState<
    "default" | "custom",
  >("default");

  let pickFilters = React.useMemo(() => {
    switch (pickFiltersState) {
      case "custom": {
        return [
          {
            name: "search",
            render: ({ value, onChange }) => {
              return (
                <input
                  value={value}
                  onChange={ev => onChange(ev.target.value)}
                />
              );
            },
          },
          "expired",
          {
            name: "sort",
            render: CustomSortRenderer,
          },
        ];
      }
      case "default":
      default: {
        return undefined;
      }
    }
  }, [pickFiltersState, setPickFiltersState]);

  let renderPickView = React.useCallback(
    (screen: Router.PickScreen) => {
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
          title={screen.title}
          description={screen.description}
        />
      );
    },
    [pickFilters],
  );

  let renderShowView = React.useCallback((screen: Router.ShowScreen) => {
    let onBack = () => {
      nav.pop();
    };
    return (
      <Grid container style={{ padding: 8 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <Button onClick={onBack}>Back</Button>
          </div>
          <Show
            endpoint={endpoint}
            fetch={screen.fetch}
            args={{ id: screen.id }}
            fields={screen.fields}
          />
        </Grid>
      </Grid>
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
    <ThemeProvider theme={theme}>
      <Grid container style={{ padding: 8 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <Typography style={{ padding: 8 }}>Views:</Typography>
          </div>
          <div style={{ marginBottom: 8 }}>
            <NavButton screen={pickUser} nav={nav} replace />
            <NavButton screen={pickPatient} nav={nav} replace />
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div>
            <Typography style={{ padding: 8 }}>Themes:</Typography>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Button
              className={appTheme === "default" ? classes.buttonActive : null}
              onClick={() => setTheme("default")}
            >
              Default
            </Button>
            <Button
              className={appTheme === "dark" ? classes.buttonActive : null}
              onClick={() => setTheme("dark")}
            >
              Dark
            </Button>
          </div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <div>
            <Typography style={{ padding: 8 }}>Renderers:</Typography>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Button
              className={
                pickFiltersState === "default" ? classes.buttonActive : null
              }
              onClick={() => setPickFiltersState("default")}
            >
              Default
            </Button>
            <Button
              className={
                pickFiltersState === "custom" ? classes.buttonActive : null
              }
              onClick={() => setPickFiltersState("custom")}
            >
              Custom
            </Button>
          </div>
        </Grid>
      </Grid>
      <React.Suspense fallback={<LoadingIndicator />}>{ui}</React.Suspense>,
    </ThemeProvider>
  );
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(
  <>
    <CssBaseline />
    <App />
  </>,
  root,
);
