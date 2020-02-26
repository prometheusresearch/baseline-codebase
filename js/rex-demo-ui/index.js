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

let pickSiteScreen = Router.pickScreen({
  type: "pick",
  resource: API.getSites,
  getRows: data => data.site.paginated,
  variablesSet: API.getSitesVariablesSet,
  fields: ["code"],
  title: "Sites",
  description: "List of sites",
  onSelect: id => [showSite, { id }],
});

let pickPatientScreen = Router.pickScreen({
  type: "pick",
  resource: API.getPatients,
  getRows: data => data.patient.paginated,
  variablesSet: API.getPatientsVariablesSet,
  fields: ["name", "date_of_birth"],
  title: "Patients",
  description: "List of patients",
  onSelect: id => [showPatient, { id }],
});

let showPatientScreen = Router.showScreen({
  type: "show",
  resource: API.getPatient,
  getRows: data => data.patient.get,
  title: "Patient",
  fields: ["name", "date_of_birth"],
});

export let pickSite = Router.route("/", pickSiteScreen);

export let showSite = Router.route("/:id", ShowSite.screen);

export let pickPatient = Router.route("/", pickPatientScreen);

export let showPatient = Router.route("/:id", showPatientScreen);

let home = Router.route(
  "/",
  Router.customScreen({
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
            fields={{ type: "type" }}
            value={value}
            onValue={onValue}
            RenderItem={RenderItem}
          />
        </div>
      );
    },
  }),
);

let users = Router.group("/users", pickUser, showUser);
let sites = Router.group("/sites", pickSite, showSite);
let patients = Router.group("/patients", pickPatient, showPatient);

export let router: Router.Router = Router.make([home, users, sites, patients]);

let menu = [home, pickUser, pickPatient, pickSite];

function App() {
  let match = Router.useMatch(router);

  let renderPickView = React.useCallback(
    <V: { [key: string]: any }, R>(screen: Router.PickScreen<V, R>, params) => {
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
          resource={screen.resource}
          sortingConfig={screen.sortingConfig}
          getRows={screen.getRows}
          variablesSet={screen.variablesSet}
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
    <V, R>(screen: Router.ShowScreen<V, R>, params) => {
      let onRemove = () => {
        router.replace(pickUser);
      };
      return (
        <Rapid.Show
          endpoint={API.endpoint}
          resource={screen.resource}
          getRows={screen.getRows}
          args={{ id: params.id }}
          fields={screen.fields}
          titleField={screen.titleField}
          RenderTitle={screen.RenderTitle}
          RenderToolbar={screen.RenderToolbar}
          onRemove={onRemove}
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
