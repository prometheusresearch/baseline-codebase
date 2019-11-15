// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import { Pick, Show, LoadingIndicator } from "rex-ui/rapid";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import { Grid, Typography } from "@material-ui/core";
import { ThemeProvider, makeStyles } from "@material-ui/styles";
import { DEFAULT_THEME, DARK_THEME } from "rex-ui/rapid/themes";

let endpoint = RexGraphQL.configure("/_api/graphql");

type Screen =
  | {|
      type: "pick",
      options: { [key: string]: any }
    |}
  | {|
      type: "show",
      options: { [key: string]: any }
    |};

const useStyles = makeStyles(theme => ({
  buttonActive: {
    background: "rgba(0,0,0,0.15)"
  }
}));

function App() {
  const classes = useStyles();

  let [screen, setScreen] = React.useState<Screen>({
    type: "pick",
    options: {
      showUsers: true
    }
  });

  let [appTheme, setTheme] = React.useState<"default" | "dark">("default");
  const theme = React.useMemo(() => {
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

  let onBack = () => {
    setScreen({ type: "pick", options: {} });
  };

  let renderPickView = React.useCallback((screen: Screen) => {
    invariant(screen.options != null, "screen.options should be object");

    const { showUsers, showPatients } = screen.options;

    let onRowClick = (row: any) => {
      setScreen({ type: "show", options: { id: row.id } });
    };

    let phoneField = {
      title: "Phone",
      require: {
        field: "phone",
        require: [{ field: "value" }]
      },
      render({ value }) {
        return value != null ? <div>tel: {value.value}</div> : "—";
      }
    };

    return (
      <>
        {showUsers ? (
          <Pick
            endpoint={endpoint}
            fetch={"user.paginated"}
            onRowClick={onRowClick}
            fields={[
              { require: { field: "remote_user" } },
              phoneField,
              "expired",
              { require: { field: "system_admin" } }
            ]}
            title={"Users"}
            description={"List of users"}
            sortableColumns={["remote_user"]}
            columnsWidth={{
              remote_user: "25%",
              phone: 200
            }}
          />
        ) : null}
        {showPatients ? (
          <Pick
            endpoint={endpoint}
            fetch={"patient.paginated"}
            title={"Patients"}
          />
        ) : null}
      </>
    );
  }, []);

  let renderShowView = React.useCallback((screen: Screen) => {
    invariant(screen.options != null, "screen.options should be object");
    invariant(screen.options.id != null, "screen.options.id should be string");

    return (
      <Grid container style={{ padding: 8 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <Button onClick={onBack}>Back</Button>
          </div>
          <Show
            endpoint={endpoint}
            fetch={"user.get"}
            args={{ id: screen.options.id }}
            fields={[
              { title: "Remote User", require: { field: "remote_user" } },
              "system_admin",
              "expired",
              {
                title: "Contact Info",
                require: {
                  field: "contact_info",
                  require: [
                    { field: "id" },
                    { field: "type" },
                    { field: "value" }
                  ]
                },
                render: ({ value }) => JSON.stringify(value)
              }
            ]}
          />
        </Grid>
      </Grid>
    );
  }, []);

  let whatToRender = (() => {
    switch (screen.type) {
      case "show":
        return renderShowView(screen);

      case "pick":
        return renderPickView(screen);
      default: {
        (screen.type: empty); // eslint-disable-line
        throw new Error(`Unknown screen: ${screen.type}`);
      }
    }
  })();

  return (
    <ThemeProvider theme={theme}>
      <Grid container style={{ padding: 8 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <Typography style={{ padding: 8 }}>Views:</Typography>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Button
              className={
                screen.type === "pick" && screen.options.showUsers
                  ? classes.buttonActive
                  : null
              }
              onClick={() =>
                setScreen(state => ({
                  type: "pick",
                  options: {
                    showUsers: true,
                    showPatients: false
                  }
                }))
              }
            >
              Users
            </Button>
            <Button
              className={
                screen.type === "pick" && screen.options.showPatients
                  ? classes.buttonActive
                  : null
              }
              onClick={() =>
                setScreen(state => ({
                  type: "pick",
                  options: {
                    showUsers: false,
                    showPatients: true
                  }
                }))
              }
            >
              Patients
            </Button>
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
      </Grid>

      {whatToRender}
    </ThemeProvider>
  );
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(
  <React.Suspense fallback={<LoadingIndicator />}>
    <CssBaseline />
    <App />
  </React.Suspense>,
  root
);
