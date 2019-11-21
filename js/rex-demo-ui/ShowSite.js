// @flow

import * as React from "react";
import * as Router from "rex-ui/Router";
import * as mui from "@material-ui/core";
import * as routes from "./index.js";

export let screen: Router.ShowScreen = {
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
        require: [
          {
            field: "user",
            require: [{ field: "id" }, { field: "remote_user" }],
          },
          { field: "role" },
        ],
      },
      render: RenderUsers,
    },
  ],
};

function RenderUsers(props) {
  let items = props.value.map(item => {
    let onClick = () => {
      routes.router.push(routes.showUser, { id: item.user.id });
    };
    return (
      <mui.ListItem button={true} onClick={onClick}>
        <mui.ListItemText
          primary={item.user.remote_user}
          secondary={item.role}
        />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
}
