// @flow

import * as React from "react";
import * as Router from "rex-ui/Router";

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
      render: ({ value }) => JSON.stringify(value),
    },
  ],
  RenderTitle: props => {
    return props.data.remote_user;
  },
};
