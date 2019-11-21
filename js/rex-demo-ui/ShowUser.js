// @flow

import * as React from "react";
import * as Router from "rex-ui/Router";
import * as mui from "@material-ui/core";
import * as routes from "./index.js";

export let screen: Router.ShowScreen = {
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
      render: ContactInfoList,
    },
    {
      title: "Sites",
      require: {
        field: "sites",
        require: [
          {
            field: "site",
            require: [{ field: "id" }, { field: "title" }],
          },
          { field: "role" },
        ],
      },
      render: SiteList,
    },
  ],
  RenderTitle: props => {
    return props.data.remote_user;
  },
};

function ContactInfoList(props) {
  let items = props.value.map(item => {
    return (
      <mui.ListItem>
        <mui.ListItemText primary={item.value} secondary={item.type} />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
}

function SiteList(props) {
  let items = props.value.map(item => {
    let onClick = () => {
      routes.router.push(routes.showSite, { id: item.site.id });
    };
    return (
      <mui.ListItem button={true} onClick={onClick}>
        <mui.ListItemText
          primary={item.site.title}
          secondary={item.role}
        />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
}
