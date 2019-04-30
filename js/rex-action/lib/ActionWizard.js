/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as css from "rex-ui/css";
import * as mui from "@material-ui/core";
import { VBox } from "react-stylesheet";

export function ActionWizard(
  props: {| noChrome?: boolean, action: React.Element<any> |}
) {
  let { action, noChrome } = props;
  action = React.cloneElement(action, {
    context: {}
  });
  if (noChrome) {
    return <VBox flexGrow={1} flexShrink={1}>{action}</VBox>;
  } else {
    return (
      <VBox flexGrow={1} flexShrink={1} background={css.rgb(244, 244, 244)}>
        <mui.Paper
          square={true}
          style={{
            display: "flex",
            flexGrow: 1,
            flexShrink: 1,
            maxWidth: 800,
            width: "100%",
            overflow: "auto",
            margin: css.margin(0, css.auto)
          }}
        >
          {action}
        </mui.Paper>
      </VBox>
    );
  }
}
