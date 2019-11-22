// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Rapid from "rex-ui/rapid";
import * as mui from "@material-ui/core";
import AppChrome from "./AppChrome";
import * as Router from "rex-ui/Router";
import * as ShowSite from "./ShowSite.js";
import * as ShowUser from "./ShowUser.js";
import * as PickUser from "./PickUser.js";
import * as API from "./API.js";

export let pickUser = Router.route("/", PickUser.screen);
export let showUser = Router.route("/:id", ShowUser.screen);

export let pickSite = Router.route("/", {
  type: "pick",
  fetch: "site.paginated",
  title: "Sites",
  description: "List of sites",
  onSelect: id => [showSite, { id }],
});

export let showSite = Router.route("/:id", ShowSite.screen);

export let pickPatient = Router.route("/", {
  type: "pick",
  fetch: "patient.paginated",
  title: "Patients",
  description: "List of patients",
  onSelect: id => [showPatient, { id }],
});

export let showPatient = Router.route("/:id", {
  type: "show",
  fetch: "patient.get",
  title: "Patient",
});

let home = Router.route("/", {
  type: "custom",
  title: "Home",
  Render(props) {
    let [value, setValue] = React.useState(null);
    let onValue = value => {
      setValue(value);
      if (value != null) {
        if (value.type === "user") {
          router.push(showUser, { id: value.id });
        } else if (value.type === "patient") {
          router.push(showPatient, { id: value.id });
        } else if (value.type === "site") {
          router.push(showSite, { id: value.id });
        }
      }
    };
    let RenderItem = React.useCallback(props => {
      return (
        <div>
          <mui.Typography>{props.label}</mui.Typography>
          <mui.Typography variant="caption">{props.item.type}</mui.Typography>
        </div>
      );
    }, []);
    return (
      <div style={{ padding: 24 }}>
        <Rapid.Autocomplete
          endpoint={API.endpoint}
          fetch="search"
          label="Search"
          labelField="label"
          fields={["type"]}
          value={value}
          onValue={onValue}
          RenderItem={RenderItem}
        />
      </div>
    );
  },
});
let users = Router.group("/users", pickUser, showUser);
let sites = Router.group("/sites", pickSite, showSite);
let patients = Router.group("/patients", pickPatient, showPatient);

export let router: Router.Router = Router.make([home, users, sites, patients]);

let menu = [home, pickUser, pickPatient, pickSite];

function App() {
  let match = Router.useMatch(router);

  let renderPickView = React.useCallback(
    (screen: Router.PickScreen, params) => {
      let onRowClick;
      if (screen.onSelect != null) {
        let onSelect = screen.onSelect;
        onRowClick = (row: any) => {
          let [route, params] = onSelect(row.id);
          router.push(route, params);
        };
      }

      return (
        <Rapid.Pick
          key={JSON.stringify(screen)}
          endpoint={API.endpoint}
          fetch={screen.fetch}
          onRowClick={onRowClick}
          fields={screen.fields}
          filters={screen.filters}
          title={screen.title}
          description={screen.description}
          RenderToolbar={screen.RenderToolbar}
        />
      );
    },
    [],
  );

  let renderShowView = React.useCallback(
    (screen: Router.ShowScreen, params) => {
      let onBack = () => {
        router.pop();
      };
      return (
        <Rapid.Show
          endpoint={API.endpoint}
          fetch={screen.fetch}
          args={{ id: params.id }}
          fields={screen.fields}
          RenderTitle={screen.RenderTitle}
        />
      );
    },
    [],
  );

  let ui = React.useMemo(() => {
    if (match == null) {
      return null;
    }
    switch (match.screen.type) {
      case "show":
        return renderShowView(match.screen, match.params);
      case "pick":
        return renderPickView(match.screen, match.params);
      case "custom":
        return <match.screen.Render params={match.params} />;
      default: {
        (match.screen.type: empty); // eslint-disable-line
        throw new Error(`Unknown screen: ${match.screen.type}`);
      }
    }
  }, [match]);

  return (
    <AppChrome menu={menu} router={router} title="Rex Rapid Demo">
      <React.Suspense fallback={<Rapid.LoadingIndicator />}>
        {ui}
      </React.Suspense>
    </AppChrome>
  );
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(
  <>
    <mui.CssBaseline />
    <App />
  </>,
  root,
);
