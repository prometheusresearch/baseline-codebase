// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Pick, Show, List, Select, LoadingIndicator } from "rex-ui/rapid";
import CssBaseline from "@material-ui/core/CssBaseline";
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

let home = Router.route("/", PickUser.screen);
let users = Router.group("/users", pickUser, showUser);
let sites = Router.group("/sites", pickSite, showSite);
let patients = Router.group("/patients", pickPatient, showPatient);

export let router: Router.Router = Router.make([
  home,
  users,
  sites,
  patients,
]);

let menu = [pickUser, pickPatient, pickSite];

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
        <Pick
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
        <Show
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
      <React.Suspense fallback={<LoadingIndicator />}>{ui}</React.Suspense>
    </AppChrome>
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
