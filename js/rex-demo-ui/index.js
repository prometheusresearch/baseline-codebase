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
} from "@material-ui/core";
import * as mui from "@material-ui/core";
import * as Router from "./Router";
import DeleteIcon from "@material-ui/icons/Delete";
import AppChrome from "./AppChrome";
import { makeStyles, type Theme } from "@material-ui/styles";

let useStyles = makeStyles((theme: Theme) => {
  return {
    customFilterLabel: {
      fontSize: 12,
      marginBottom: 12,
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

let showUser = (id: string): Router.ShowScreen => ({
  type: "show",
  title: "User",
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
  RenderTitle: props => {
    return props.data.remote_user;
  },
});

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

let customPickUserFilters = [
  {
    name: "search",
    render: ({ value, onChange }) => {
      return <input value={value} onChange={ev => onChange(ev.target.value)} />;
    },
  },
  "expired",
  {
    name: "sort",
    render: CustomSortRenderer,
  },
];

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
  onSelect: id => showUser(id),
};

let pickUserWithCustomFilters: Router.PickScreen = {
  ...pickUser,
  title: "Users (with custom filters)",
  filters: customPickUserFilters,
};

let pickPatient: Router.PickScreen = {
  type: "pick",
  fetch: "patient.paginated",
  title: "Patients",
  description: "List of patients",
};

function App() {
  let nav = Router.useNavigation(pickUser);

  let renderPickView = React.useCallback(
    (screen: Router.PickScreen) => {
      let onRowClick;
      if (screen.onSelect != null) {
        let onSelect = screen.onSelect;
        onRowClick = (row: any) => nav.push(onSelect(row.id));
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
    [nav.screen],
  );

  let renderShowView = React.useCallback(
    (screen: Router.ShowScreen) => {
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
              RenderTitle={screen.RenderTitle}
            />
          </mui.Grid>
        </mui.Grid>
      );
    },
    [nav.screen],
  );

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
    <AppChrome
      nav={nav}
      menu={[pickUser, pickUserWithCustomFilters, pickPatient]}
      title="Rex Rapid Demo"
    >
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
