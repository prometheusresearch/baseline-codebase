// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import * as Resource from "rex-graphql/Resource";
import { Pick, Show, List, Select, LoadingIndicator } from "rex-ui/rapid";
import CssBaseline from "@material-ui/core/CssBaseline";
import {
  FormLabel,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import * as mui from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import AddBoxIcon from "@material-ui/icons/AddBox";
import AppChrome from "./AppChrome";
import { makeStyles, type Theme } from "@material-ui/styles";
import { Button } from "rex-ui/Button";
import * as Router from "rex-ui/Router";
import { route, make as makeRouter } from "rex-ui/Router";
import * as ShowSite from "./ShowSite.js";
import * as ShowUser from "./ShowUser.js";
import * as PickUser from "./PickUser.js";
import * as API from "./API.js";

let useStyles = makeStyles((theme: Theme) => {
  return {
    customFilterLabel: {
      fontSize: 12,
    },
  };
});

export let pickUser = route("/users", PickUser.screen);

export let pickPatient = route("/patients", {
  type: "pick",
  fetch: "patient.paginated",
  title: "Patients",
  description: "List of patients",
});

export let pickSite = route("/sites", {
  type: "pick",
  fetch: "site.paginated",
  title: "Sites",
  description: "List of sites",
  onSelect: id => [showSite, { id }],
});

export let showSite = route("/sites/:id", ShowSite.screen);
export let showUser = route("/users/:id", ShowUser.screen);

export let router: Router.Router = Router.make([
  route("/", pickUser.screen),
  pickUser,
  showUser,
  pickSite,
  showSite,
  pickPatient,
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
