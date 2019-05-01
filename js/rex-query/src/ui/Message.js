/**
 * @flow
 */

import * as React from "react";
import { style, VBox } from "react-stylesheet";

type MessageProps = {
  children?: React.Node,
  textAlign?: "center" | "left" | "right"
};

export default function Message({
  children,
  textAlign = "center",
  ...props
}: MessageProps) {
  return (
    <MessageRoot {...props}>
      <MessageChildrenWrapper style={{ textAlign }}>
        {children}
      </MessageChildrenWrapper>
    </MessageRoot>
  );
}

let MessageRoot = style(VBox, {
  displayName: "MessageRoot",
  base: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "auto",

    fontWeight: 200,
    fontSize: "10pt",
    color: "#aaa"
  }
});

let MessageChildrenWrapper = style("p", {
  displayName: "MessageChildrenWrapper",
  base: {
    width: "80%"
  }
});
