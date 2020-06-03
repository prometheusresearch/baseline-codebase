/**
 * Scroll view with auto shadows
 * @flow
 */

import * as React from "react";
import classnames from "classnames";
import { makeStyles, useTheme, type Theme } from "@material-ui/styles";

let useStyles = makeStyles((theme: Theme) => {
  let ScrollViewSize = 8;
  let ScrollViewShadowTop = [
    `linear-gradient(180deg, rgba(100,100,100,0.5) 0%`,
    `rgba(220,220,220,0.8) 30%`,
    `rgba(255,255,255,0) 100%)`,
  ].join(", ");

  let ScrollViewShadowBottom = [
    `linear-gradient(0deg, rgba(100,100,100,0.5) 0%`,
    `rgba(220,220,220,0.8) 30%`,
    `rgba(255,255,255,0) 100%)`,
  ].join(", ");
  let ScrollViewZIndex = 10;
  return {
    // ScrollView
    ScrollViewRoot: props => ({
      background: props.backgroundColor,
      position: "relative",
      width: "100%",
      minHeight: 0,
      display: "flex",
      flexShrink: 0,
      flexGrow: 1,
      flexBasis: 0,
      flexDirection: "column",
      "&::before": {
        content: "''",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: ScrollViewSize,
        background: ScrollViewShadowTop,
        zIndex: ScrollViewZIndex,
      },
      "&::after": {
        content: "''",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: ScrollViewSize,
        background: ScrollViewShadowBottom,
        zIndex: ScrollViewZIndex,
      },
    }),

    ScrollViewList: props => ({
      background: props.backgroundColor,
      display: "flex",
      flexDirection: "column",
      flex: "1 1 auto",
      overflowY: "auto",
      overflowX: "hidden",
      margin: 0,
      "&::before": {
        content: "''",
        height: ScrollViewSize,
        width: "100%",
        background: props.backgroundColor,
        flexShrink: 0,
        zIndex: ScrollViewZIndex + 1,
        transform: "translate3d(0,0,0)",
      },
      "&::after": {
        content: "''",
        height: ScrollViewSize,
        width: "100%",
        background: props.backgroundColor,
        flexGrow: 1,
        flexShrink: 0,
        zIndex: ScrollViewZIndex + 1,
        transform: "translate3d(0,0,0)",
      },
    }),
  };
});

type ScrollViewProps = {|
  children: React.Node,
  onScroll?: () => void,
  backgroundColor?: string,
  classes?: {|
    root?: ?string,
    list?: ?string,
  |},
|};

export default function ScrollView({
  children,
  onScroll,
  backgroundColor,
  classes = {},
}: ScrollViewProps) {
  let theme = useTheme();
  if (backgroundColor == null) {
    backgroundColor = theme.palette.common.white;
  }
  let styles = useStyles({ backgroundColor });
  return (
    <div className={classnames(classes.root, styles.ScrollViewRoot)}>
      <div
        className={classnames(classes.list, styles.ScrollViewList)}
        onScroll={onScroll}
      >
        {children}
      </div>
    </div>
  );
}
