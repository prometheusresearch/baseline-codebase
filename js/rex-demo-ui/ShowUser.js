// @flow

import * as React from "react";
import * as mui from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import AddBoxIcon from "@material-ui/icons/AddBox";

import { Button } from "rex-ui/Button";
import * as Router from "rex-ui/Router";
import * as Resource from "rex-graphql/Resource2";
import { Select, List, LoadingIndicator } from "rex-ui/rapid";

import * as routes from "./index.js";
import * as API from "./API.js";

function RenderToolbar(props) {
  let { data, onRemove, onAdd } = props;
  return (
    <div>
      <RemoveAction data={data} onRemove={onRemove} />
      <AddToSiteAction data={data} onAdd={onAdd} />
    </div>
  );
}

export let screen = Router.showScreen<API.getUserVariables, API.getUserResult>({
  type: "show",
  title: "User",
  resource: API.getUser,
  getRows: data => data.user.get,
  fields: [
    { name: "remote_user", title: "Remote User" },
    "system_admin",
    "expired",

    {
      name: "contact_info",
      title: "Contact Info",
      render: ContactInfoList,
    },
    { name: "sites", title: "Sites", render: SiteList },
    { name: "patients", title: "Patients", render: PatientList },
  ],
  titleField: "remote_user",
  RenderToolbar,
});

function ContactInfoList(props) {
  let items = props.value.map((item, index) => {
    return (
      <mui.ListItem key={index}>
        <mui.ListItemText primary={item.value} secondary={item.type} />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
}

function SiteList(props) {
  let items = props.value.map((item, index) => {
    let onClick = () => {
      routes.router.push(routes.showSite, { id: item.site.id });
    };
    return (
      <mui.ListItem button={true} onClick={onClick} key={index}>
        <mui.ListItemText primary={item.site.title} secondary={item.role} />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
}

function PatientList(props) {
  let items = props.value.map((item, index) => {
    let onClick = () => {
      routes.router.push(routes.showPatient, { id: item.id });
    };
    return (
      <mui.ListItem button={true} onClick={onClick} key={index}>
        <mui.ListItemText primary={item.name} />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
}

function RemoveAction({ data, onRemove }) {
  let onClick = () => {
    let id = data.id;
    Resource.perform(API.endpoint, API.removeUser, { userIds: [id] }).then(
      () => {
        onRemove && onRemove();
      },
    );
  };
  return (
    <Button size="small" onClick={onClick} icon={<DeleteIcon />}>
      Remove
    </Button>
  );
}

function AddToSiteActionDialog({ data, onClose }) {
  let [site, setSite] = React.useState(null);
  let onSubmit = () => {
    if (site == null) {
      return;
    }
    let userIds = [data.id];
    Resource.perform(API.endpoint, API.addUserToSite, {
      userIds,
      siteId: site,
    }).finally(() => {
      onClose(true);
    });
  };
  let getSelectRows = (r: API.getAllSitesResult) => r.site.all;
  return (
    <React.Suspense fallback={<LoadingIndicator />}>
      <mui.DialogTitle>Add user to a site</mui.DialogTitle>
      <mui.DialogContent>
        <div style={{ marginBottom: 16 }}>
          <mui.DialogContentText id="alert-dialog-description">
            Site to add user to:
          </mui.DialogContentText>
          <Select
            endpoint={API.endpoint}
            resource={API.getAllSites}
            getRows={getSelectRows}
            labelField="title"
            value={site}
            onValue={setSite}
          />
        </div>
      </mui.DialogContent>
      <mui.DialogActions>
        <mui.Button onClick={onSubmit} color="primary">
          Add
        </mui.Button>
        <mui.Button onClick={() => onClose(false)} color="secondary">
          Cancel
        </mui.Button>
      </mui.DialogActions>
    </React.Suspense>
  );
}

function AddToSiteAction({ data, onAdd }) {
  let [site, setSite] = React.useState(null);
  let [open, setOpen] = React.useState(false);
  let onClose = done => {
    if (done) {
      onAdd && onAdd();
    }
    setOpen(false);
  };
  let onOpen = () => setOpen(true);
  return (
    <>
      <Button size="small" icon={<AddBoxIcon />} onClick={onOpen}>
        Add to site
      </Button>
      <mui.Dialog open={open} onClose={onClose}>
        <AddToSiteActionDialog data={data} onClose={onClose} />
      </mui.Dialog>
    </>
  );
}
