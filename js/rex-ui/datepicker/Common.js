// @flow

import * as React from "react";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import * as rexui from "rex-ui";

export let useActiveColors = () => {
  let theme = rexui.useTheme();
  return { backgroundColor: theme.palette.secondary.main, color: "#eeeeee" };
};

export const buttonSize = 36;
export const buttonStyle = {
  width: buttonSize,
  height: buttonSize,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "1rem",
  padding: 4
};

export let BackButtonWithTitle = ({
  onClose,
  title
}: {|
  title: React.Node,
  onClose: () => void
|}) => {
  let theme = rexui.useTheme();
  return (
    <div
      style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
    >
      <mui.IconButton style={buttonStyle} onClick={onClose}>
        <icons.Close />
      </mui.IconButton>
      <div style={{ paddingLeft: theme.spacing.unit }}>
        <mui.Typography
          style={{ color: theme.palette.text.secondary }}
          variant="h6"
        >
          {title}
        </mui.Typography>
      </div>
    </div>
  );
};

export let Paginator = (props: {|
  onPrev: () => void,
  onNext: () => void,
  onUp?: () => void,
  title: React.Node
|}) => {
  let { onPrev, onNext, onUp, title } = props;
  let theme = rexui.useTheme();
  return (
    <div
      style={{
        height: 44,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between"
      }}
    >
      <mui.Button
        onClick={onUp}
        style={{
          ...buttonStyle,
          textAlign: "left",
          display: "flex",
          flexGrow: 1,
          borderRadius: buttonSize / 2
        }}
      >
        <mui.Typography
          style={{ color: theme.palette.text.secondary, textTransform: "none" }}
          variant="h6"
        >
          {title}
        </mui.Typography>
      </mui.Button>
      <mui.IconButton style={buttonStyle} onClick={onPrev}>
        <icons.KeyboardArrowLeft />
      </mui.IconButton>
      <mui.IconButton style={buttonStyle} onClick={onNext}>
        <icons.KeyboardArrowRight />
      </mui.IconButton>
    </div>
  );
};
