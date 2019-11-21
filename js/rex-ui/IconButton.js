/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { impossible } from "./lang";
import { useTheme } from "./Theme.js";
import { fade } from "@material-ui/core/styles/colorManipulator";

type Props = {|
  icon: React.Node,
  disabled?: boolean,
  onClick?: (e: UIEvent) => void,
  onFocus?: (e: UIEvent) => void,
  onBlur?: (e: UIEvent) => void,
  size?: "small" | "medium" | "large",
  "aria-label"?: string,
  className?: string,
  active?: boolean,
|};

export let IconButton = React.forwardRef<Props, HTMLElement>(
  (
    {
      icon,
      disabled,
      onClick,
      onFocus,
      onBlur,
      size = "medium",
      active,
      ...rest
    }: Props,
    ref,
  ) => {
    let theme = useTheme();
    let style = React.useMemo(() => {
      let style = {
        color: active
          ? theme.palette.common.white
          : theme.palette.action.active,
        backgroundColor: active
          ? fade(theme.palette.primary.main, 0.6)
          : "transparent",
      };
      switch (size) {
        case "small":
          style = {
            ...style,
            transform: `scale(0.8)`,
          };
          break;
        case "medium":
          break;
        case "large":
          style = {
            ...style,
            transform: `scale(1.2)`,
          };
          break;
        default:
          impossible(size);
          break;
      }
      return style;
    }, [theme, active, size]);
    return (
      <mui.IconButton
        {...rest}
        buttonRef={ref}
        disabled={disabled}
        style={style}
        onClick={onClick}
        onFocus={onFocus}
      >
        {icon}
      </mui.IconButton>
    );
  },
);
