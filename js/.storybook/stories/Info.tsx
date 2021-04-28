import * as React from "react";
import { withInfo } from "@storybook/addon-info";

type InfoComponent = (
  fn: React.FunctionComponent,
) => () => React.ReactElement<any>;

export let Info: InfoComponent = (fn: React.FunctionComponent) =>
  withInfo({ inline: true })(() => {
    return <div style={{ padding: "10px 40px" }}>{fn({})}</div>;
  });
