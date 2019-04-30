/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { impossible } from "./lang";

type Props = {|
  icon: React.Node,
  disabled?: boolean,
  onClick?: (e: UIEvent) => void,
  onFocus?: (e: UIEvent) => void,
  onBlur?: (e: UIEvent) => void,
  size?: "small" | "medium" | "large"
|};

export let IconButton = React.forwardRef<Props, HTMLElement>(
  (
    { icon, disabled, onClick, onFocus, onBlur, size = "medium" }: Props,
    ref
  ) => {
    let style = {};
    switch (size) {
      case "small":
        style = {
          transform: `scale(0.8)`
        };
        break;
      case "medium":
        break;
      case "large":
        style = {
          transform: `scale(1.2)`
        };
        break;
      default:
        impossible(size);
        break;
    }
    return (
      <mui.IconButton
        buttonRef={ref}
        disabled={disabled}
        style={style}
        onClick={onClick}
        onFocus={onFocus}
      >
        {icon}
      </mui.IconButton>
    );
  }
);
