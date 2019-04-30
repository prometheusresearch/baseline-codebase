/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";
import * as rexui from "rex-ui";
import { boxShadow, rgba } from "rex-ui/css";
import { VBox, HBox } from "react-stylesheet";
import Icon from "./Icon";

let NotificationStyle = {
  icon: {
    marginRight: "10px",
    textAlign: "center"
  },
  success: {
    color: "#3c763d",
    backgroundColor: "#dff0d8",
    borderColor: "#d6e9c6"
  },
  danger: {
    color: "#a94442",
    backgroundColor: "#f2dede",
    borderColor: "#ebccd1"
  },
  info: {
    color: "#31708f",
    backgroundColor: "#d9edf7",
    borderColor: "#bce8f1"
  },
  warning: {
    color: "#8a6d3b",
    backgroundColor: "#fcf8e3",
    borderColor: "#faebcc"
  }
};

export type Props = {|
  /**
   * If ``props`` has children, they will be rendered.
   */
  children?: React.Node,
  text?: React.Node,

  /**
   * The name of the icon to render.
   */
  icon?: string | React.Node,

  /**
   * Selects the css style.
   * The string is the name of a set of css settings.
   * Otherwise the object is used.
   * Naturally it must have only valid css attributes.
   */
  kind?: "icon" | "success" | "danger" | "info" | "warning"
|};

/**
 * Renders children xor text, using the NotificationStyle.
 * This content is optionally preceeded by an icon.
 * The notification is removed after **ttl** seconds.
 *
 * @public
 */
function Notification(props: Props) {
  let { children, text, icon, kind = "info" } = props;
  let theme = rexui.useTheme();
  let style = {
    padding: theme.spacing.unit * 2,
    ...NotificationStyle[kind]
  };
  return (
    <mui.Paper style={style}>
      <HBox>
        {icon && (
          <VBox style={NotificationStyle.icon}>
            {typeof icon === "string" ? <Icon name={icon} /> : icon}
          </VBox>
        )}
        {children || text}
      </HBox>
    </mui.Paper>
  );
}

export default Notification;
