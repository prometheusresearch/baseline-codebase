/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { useTheme } from "./Theme";

export type Size = "small";

export type Props = {|
  size?: Size,
  disabled?: boolean,
  icon?: React.Node,
  variant?: "contained",
  children?: React.Node,
  onClick?: (e: UIEvent) => void,
  style?: Object,
  title?: string,
  href?: string,
|};

export let ButtonIcon = ({
  size,
  icon,
  hasChildren,
}: {|
  size?: Size,
  icon?: React.Node,
  hasChildren?: boolean,
|}) => {
  let theme = useTheme();
  let iconElement = null;
  if (icon != null) {
    let paddingRight = 0;
    if (hasChildren) {
      if (size === "small") {
        paddingRight = 0;
      } else {
        paddingRight = theme.spacing.unit;
      }
    }
    let iconStyle = {
      paddingRight,
      height: "1em",
      marginLeft: -theme.spacing.unit / 4,
      transform: size === "small" ? "scale(0.75)" : null,
    };
    iconElement = <div style={iconStyle}>{icon}</div>;
  }
  return iconElement;
};

export let Button = (props: Props) => {
  let theme = useTheme();
  let { icon, children, size, style, ...rest } = props;

  let iconElement = null;
  if (icon != null) {
    let paddingRight = 0;
    if (children != null) {
      if (size === "small") {
        paddingRight = theme.spacing.unit / 4;
      } else {
        paddingRight = theme.spacing.unit;
      }
    }
    let iconStyle = {
      paddingRight,
      height: "1em",
      transform: size === "small" ? "scale(0.75)" : null,
    };
    iconElement = <div style={iconStyle}>{icon}</div>;
  }

  return (
    <mui.Button {...rest} size={size} style={{ ...style, alignItems: "unset" }}>
      <ButtonIcon icon={icon} hasChildren={children != null} size={size} />
      {children}
    </mui.Button>
  );
};
