// @flow

import * as React from "react";
import * as Router from "rex-ui/Router";
import * as Rapid from "rex-ui/rapid";
import * as mui from "@material-ui/core";
import * as routes from "./index.js";

export let screen: Router.ShowScreen = {
  type: "show",
  fetch: "site.get",
  title: "Site",
  fields: {
    title: {
      title: "Title",
      require: { field: "title" },
    },
    code: {
      title: "Code",
      require: { field: "code" },
    },
    users: {
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
      render: UserList,
    },
  },
};

function UserList(props) {
  let RenderPrimaryText = React.useCallback(
    props => props.item.user.remote_user,
    [],
  );
  let RenderSecondaryText = React.useCallback(props => props.item.role, []);
  let onClick = React.useCallback(
    item => routes.router.push(routes.showUser, { id: item.user.id }),
    [],
  );
  return (
    <Rapid.ListOfData
      data={props.value}
      onClick={onClick}
      RenderPrimaryText={RenderPrimaryText}
      RenderSecondaryText={RenderSecondaryText}
    />
  );
}
