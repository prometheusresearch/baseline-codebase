/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { style } from "react-stylesheet";

import loadingIndicatorImg from "./loading-indicator.gif"; // eslint-disable-line

export default class LoadingIndicator extends React.Component<{}> {
  render() {
    return (
      <Root>
        <img src={loadingIndicatorImg} alt="loading..." />
      </Root>
    );
  }

  shouldComponentUpdate() {
    return false;
  }
}

let Root = style("div", {
  base: {
    width: "100%",
    textAlign: "center"
  }
});
