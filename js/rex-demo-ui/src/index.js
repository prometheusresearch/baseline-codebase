// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import { Pick, Show, LoadingIndicator } from "rex-ui/rapid";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import { Grid } from "@material-ui/core";

let endpoint = RexGraphQL.configure("/_api/graphql");

type Screen = { type: "pick" } | { type: "show", id: string };

function App() {
  let [screen, setScreen] = React.useState<Screen>({ type: "pick" });

  let onBack = () => {
    setScreen({ type: "pick" });
  };

  let renderPickView = React.useCallback(() => {
    let onRowClick = (row: any) => {
      setScreen({ type: "show", id: row.id });
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
      />
    );
  }, []);

  let renderShowView = React.useCallback(id => {
    return (
      <Grid container style={{ padding: 8 }}>
        <Grid item xs={12} sm={6} md={3}>
          <div>
            <Button onClick={onBack}>Back</Button>
          </div>
          <Show
            endpoint={endpoint}
            fetch={"user.get"}
            args={{ id: id }}
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

  switch (screen.type) {
    case "show":
      return renderShowView(screen.id);
    case "pick":
      return renderPickView();
    default: {
      (screen.type: empty); // eslint-disable-line
      throw new Error(`Unknown screen: ${screen.type}`);
    }
  }
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
