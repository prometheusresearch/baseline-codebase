// @flow

import * as React from "react";
import * as mui from "@material-ui/core";
import * as Common from "./Common";

type Props = {
  children: React.Node
};

export let Frame = (props: Props) => {
  let style = {
    width: Common.buttonSize * 7 + 10,
    padding: 5
  };
  return <mui.Card style={style}>{props.children}</mui.Card>;
};
