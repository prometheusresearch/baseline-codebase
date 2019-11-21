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

let useStyles = makeStyles((theme: Theme) => {
  return {
    customFilterLabel: {
      fontSize: 12,
    },
  };
});

let endpoint = RexGraphQL.configure("/_api/graphql");

let removeUser = Resource.defineMutation<{| userIds: string[] |}, void>({
  endpoint,
  mutation: `
    mutation removeUser($userIds: [user_id]!) {
      remove_user(user_ids: $userIds)
    }
  `,
});

let addUserToSite = Resource.defineMutation<
  {| userIds: string[], siteId: string |},
  void,
>({
  endpoint,
  mutation: `
    mutation addUserToSite($userIds: [user_id]!, $siteId: site_id!) {
      add_user_to_site(user_ids: $userIds, site_id: $siteId)
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

function AddToSiteActionDialog({
  initialSelected,
  selected,
  onSelected,
  onSubmit,
  onClose,
  site,
  onSite,
}) {
  return (
    <React.Suspense fallback={<LoadingIndicator />}>
      <mui.DialogTitle>Add users to a site</mui.DialogTitle>
      <mui.DialogContent>
        <mui.DialogContentText id="alert-dialog-description">
          Please confirm that you are going to add the following users:
        </mui.DialogContentText>
        <List
          endpoint={endpoint}
          fetch="user.get_many"
          id={[...initialSelected]}
          primaryTextField="remote_user"
          selected={selected}
          onSelected={onSelected}
        />
        <mui.DialogContentText id="alert-dialog-description">
          To the following site:
        </mui.DialogContentText>
        <Select
          endpoint={endpoint}
          fetch="site.all"
          labelField="title"
          value={site}
          onValue={onSite}
        />
      </mui.DialogContent>
      <mui.DialogActions>
        <mui.Button
          onClick={onSubmit}
          color="primary"
          disabled={selected.size === 0 || site == null}
        >
          Add
        </mui.Button>
        <mui.Button onClick={onClose} color="secondary">
          Cancel
        </mui.Button>
      </mui.DialogActions>
    </React.Suspense>
  );
}

function AddToSiteAction({ selected: initialSelected, disabled }) {
  let [selected, setSelected] = React.useState(null);
  let [site, setSite] = React.useState(null);
  let [open, setOpen] = React.useState(false);
  let onClose = () => setOpen(false);
  let onOpen = () => setOpen(true);
  let onSubmit = () => {
    if (site == null) {
      return;
    }
    let userIds = selected != null ? [...selected] : [...initialSelected];
    Resource.perform(addUserToSite, { userIds, siteId: site }).then(() => {
      onClose();
    });
  };
  return (
    <>
      <Button
        size="small"
        disabled={disabled}
        icon={<AddBoxIcon />}
        onClick={onOpen}
      >
        Add to site
      </Button>
      <mui.Dialog open={open} onClose={onClose}>
        <AddToSiteActionDialog
          initialSelected={initialSelected}
          selected={selected != null ? selected : initialSelected}
          onSelected={setSelected}
          site={site}
          onSite={setSite}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      </mui.Dialog>
    </>
  );
}

let pickUser = route("/users", {
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
    let disabled = props.selected.size === 0;
    return (
      <>
        <mui.Typography variant="caption">{caption}</mui.Typography>
        <div>
          <AddToSiteAction selected={props.selected} disabled={disabled} />
          <Button
            size="small"
            disabled={disabled}
            onClick={onRemove}
            icon={<DeleteIcon />}
          >
            Remove
          </Button>
        </div>
      </>
    );
  },
  onSelect: id => [showUser, { id }],
});

let pickUserWithCustomFilters = route("/users-custom", {
  type: "pick",
  ...pickUser.screen,
  title: "Users (with custom filters)",
  filters: customPickUserFilters,
});

let showUser = route("/users/:id", {
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
});

let pickPatient = route("/patients", {
  type: "pick",
  fetch: "patient.paginated",
  title: "Patients",
  description: "List of patients",
});

let pickSite = route("/sites", {
  type: "pick",
  fetch: "site.paginated",
  title: "Sites",
  description: "List of sites",
  onSelect: id => [showSite, { id }],
});

let showSite = route("/sites/:id", {
  type: "show",
  fetch: "site.get",
  title: "Site",
  fields: [
    { title: "Title", require: { field: "title" } },
    { title: "Code", require: { field: "code" } },
    {
      title: "Users",
      require: {
        field: "users",
        require: [{ field: "user" }, { field: "role" }],
      },
      render: ({ value }) => JSON.stringify(value),
    },
  ],
});

let router: Router.Router = Router.make([
  route("/", pickUser.screen),
  pickUser,
  showUser,
  pickUserWithCustomFilters,
  pickPatient,
  pickSite,
  showSite,
]);

let menu = [pickUser, pickUserWithCustomFilters, pickPatient, pickSite];

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
    (screen: Router.ShowScreen, params) => {
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
