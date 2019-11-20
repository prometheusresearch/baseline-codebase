// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import * as Resource from "rex-graphql/Resource";
import { Pick, Show, LoadingIndicator } from "rex-ui/rapid";
import Button from "@material-ui/core/Button";
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
import * as Screen from "./Screen.js";
import DeleteIcon from "@material-ui/icons/Delete";
import AppChrome from "./AppChrome";
import { makeStyles, type Theme } from "@material-ui/styles";
import * as Router from "rex-ui/Router";

let useStyles = makeStyles((theme: Theme) => {
  return {
    customFilterLabel: {
      fontSize: 12,
    },
  };
});

let endpoint = RexGraphQL.configure("/_api/graphql");

let removeUser = Resource.defineMutation<{ userIds: string[] }, void>({
  endpoint,
  mutation: `
    mutation removeUser($userIds: [user_id]!) {
      remove_user(user_ids: $userIds)
    }
  `,
});

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

const CustomSortRenderer = ({ value, values, onChange }) => {
  const classes = useStyles();

  const valueString =
    typeof value === "string" || value === undefined
      ? value
      : JSON.stringify(value);

  return (
    <FormControl component="fieldset">
      <FormLabel style={{ fontSize: 14 }} component="legend">
        Sorting
      </FormLabel>
      <RadioGroup
        aria-label="Sorting"
        name="sorting"
        value={valueString}
        onChange={ev => onChange(ev.target.value)}
      >
        {(values || []).map(val => {
          const valString =
            typeof val === "string" || val === undefined
              ? val
              : JSON.stringify(val);

          const label =
            typeof val === "string" && val !== "undefined"
              ? val
              : val === undefined || val === "undefined"
              ? "None"
              : `${val.field}, ${val.desc ? `desc` : `asc`}`;

          return (
            <FormControlLabel
              key={valString}
              value={valString}
              control={<Radio />}
              label={label}
              classes={{
                label: classes.customFilterLabel,
              }}
            />
          );
        })}
      </RadioGroup>
    </FormControl>
  );
};

function ShowOnlyAdmins(props) {
  let checked = Boolean(props.value);
  let handleOnChange = e => {
    if (e.target.checked) {
      props.onChange(true);
    } else {
      props.onChange(undefined);
    }
  };
  return (
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={handleOnChange} />}
      label="Show admins only"
    />
  );
}

let customPickUserFilters = [
  {
    name: "system_admin",
    render: ShowOnlyAdmins,
  },
];

let pickUser: Router.Route<Screen.PickScreen> = {
  path: "/users",
  screen: {
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
    filters: undefined,

    RenderToolbar: props => {
      let caption = "No users selected";
      if (props.selected.size > 0) {
        caption = `Selected ${props.selected.size} users`;
      }
      let onRemove = () => {
        let userIds = [...props.selected];
        Resource.perform(removeUser, { userIds }).then(() => {
          props.onSelected(new Set());
        });
      };
      return (
        <>
          <mui.Typography variant="caption">{caption}</mui.Typography>
          <mui.Button
            size="small"
            color="secondary"
            disabled={props.selected.size === 0}
            onClick={onRemove}
          >
            <DeleteIcon />
            Remove
          </mui.Button>
        </>
      );
    },
    onSelect: id => [showUser, { id }],
  },
};

let pickUserWithCustomFilters: Router.Route<Screen.PickScreen> = {
  path: "/users-custom",
  screen: {
    ...pickUser.screen,
    title: "Users (with custom filters)",
    filters: customPickUserFilters,
  },
};

let showUser = {
  path: "/users/:id",
  screen: {
    type: "show",
    title: "User",
    fetch: "user.get",
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
    RenderTitle: props => {
      return props.data.remote_user;
    },
  },
};

let pickPatient: Router.Route<Screen.PickScreen> = {
  path: "/patients",
  screen: {
    type: "pick",
    fetch: "patient.paginated",
    title: "Patients",
    description: "List of patients",
  },
};

let router: Router.Router<Screen.Screen> = Router.make([
  { ...pickUser, path: "/" },
  pickUser,
  showUser,
  pickUserWithCustomFilters,
  pickPatient,
]);

let menu = [
  { route: pickUser },
  { route: pickUserWithCustomFilters },
  { route: pickPatient },
];

function App() {
  let match = Router.useMatch(router);

  let renderPickView = React.useCallback(
    (screen: Screen.PickScreen, params) => {
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
          endpoint={endpoint}
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
    (screen: Screen.ShowScreen, params) => {
      let onBack = () => {
        router.pop();
      };
      return (
        <Show
          endpoint={endpoint}
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
