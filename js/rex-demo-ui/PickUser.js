// @flow

import * as React from "react";
import * as mui from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import AddBoxIcon from "@material-ui/icons/AddBox";
import { Select, List, LoadingIndicator } from "rex-ui/rapid";
import { Button } from "rex-ui/Button";
import * as Router from "rex-ui/Router";
import * as Resource from "rex-graphql/Resource";
import * as API from "./API.js";
import * as routes from "./index.js";

import * as API2 from "./graphql.api";

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

function ShowOnlyAdminsFilter(props) {
  let checked = Boolean(props.value);
  let handleOnChange = e => {
    if (e.target.checked) {
      props.onChange(true);
    } else {
      props.onChange(undefined);
    }
  };
  return (
    <mui.FormControlLabel
      control={<mui.Checkbox checked={checked} onChange={handleOnChange} />}
      label="Show admins only"
    />
  );
}

export let screen: Router.PickScreen<API2.UsersVariables, API2.UsersResult> = {
  type: "pick",
  fetch: "user.paginated",
  resource: API2.Users,
  title: "Users",
  description: "List of users",
  fields: {
    remote_user: {
      require: { field: "remote_user" },
      sortable: false,
      width: 256,
    },
    phone: phoneField,
    expires: "expires",
    expired: "expired",
    system_admin: {
      require: { field: "system_admin" },
    },
  },
  filters: [
    {
      name: "system_admin",
      render: ShowOnlyAdminsFilter,
    },
  ],
  RenderToolbar: props => {
    let caption = "No users selected";
    if (props.selected.size > 0) {
      caption = `Selected ${props.selected.size} users`;
    }
    let disabled = props.selected.size === 0;
    return (
      <>
        <mui.Typography variant="caption">{caption}</mui.Typography>
        <div>
          <RemoveAction
            selected={props.selected}
            onSelected={props.onSelected}
          />
          <AddToSiteAction
            selected={props.selected}
            onSelected={props.onSelected}
          />
        </div>
      </>
    );
  },
  onSelect: id => [routes.showUser, { id }],
};

function RemoveAction({ selected, onSelected }) {
  let onClick = () => {
    let userIds = [...selected];
    Resource.perform(API.removeUser, { userIds }).then(() => {
      onSelected(new Set());
    });
  };
  return (
    <Button
      size="small"
      disabled={selected.size === 0}
      onClick={onClick}
      icon={<DeleteIcon />}
    >
      Remove
    </Button>
  );
}

function AddToSiteActionDialog({ selected: initialSelected, onClose }) {
  let [selected, setSelected] = React.useState(initialSelected);
  let [site, setSite] = React.useState(null);
  let onSubmit = () => {
    if (site == null) {
      return;
    }
    let userIds = [...selected];
    Resource.perform(API.addUserToSite, { userIds, siteId: site }).then(() => {
      onClose(true);
    });
  };
  return (
    <React.Suspense fallback={<LoadingIndicator />}>
      <mui.DialogTitle>Add users to a site</mui.DialogTitle>
      <mui.DialogContent>
        <div style={{ marginBottom: 16 }}>
          <mui.DialogContentText id="alert-dialog-description">
            Site to add users to:
          </mui.DialogContentText>
          <Select
            endpoint={API.endpoint}
            fetch="site.all"
            labelField="title"
            value={site}
            onValue={setSite}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <mui.DialogContentText id="alert-dialog-description">
            The following users will be added to the site:
          </mui.DialogContentText>
          <List
            endpoint={API.endpoint}
            fetch="user.get_many"
            id={[...initialSelected]}
            primaryTextField="remote_user"
            selected={selected}
            onSelected={setSelected}
          />
        </div>
      </mui.DialogContent>
      <mui.DialogActions>
        <mui.Button
          onClick={onSubmit}
          color="primary"
          disabled={selected.size === 0 || site == null}
        >
          Add
        </mui.Button>
        <mui.Button onClick={() => onClose(false)} color="secondary">
          Cancel
        </mui.Button>
      </mui.DialogActions>
    </React.Suspense>
  );
}

function AddToSiteAction({ selected, onSelected }) {
  let [site, setSite] = React.useState(null);
  let [open, setOpen] = React.useState(false);
  let onClose = done => {
    if (done) {
      onSelected(new Set());
    }
    setOpen(false);
  };
  let onOpen = () => setOpen(true);
  return (
    <>
      <Button
        size="small"
        disabled={selected.size === 0}
        icon={<AddBoxIcon />}
        onClick={onOpen}
      >
        Add to site
      </Button>
      <mui.Dialog open={open} onClose={onClose}>
        <AddToSiteActionDialog selected={selected} onClose={onClose} />
      </mui.Dialog>
    </>
  );
}
