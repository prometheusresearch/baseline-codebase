/**
 * @flow
 */

import React from "react";
import { Element } from "react-stylesheet";

type ArrowDownProps = {|
  top?: number,
  left?: number,
  bottom?: number,
  color?: string,
  size?: number
|};

export default function ArrowDown({
  color = "red",
  size = 5,
  ...props
}: ArrowDownProps) {
  return (
    <Element
      position="absolute"
      {...props}
      width={0}
      height={0}
      borderLeft={{ width: size, style: "solid", color: "transparent" }}
      borderRight={{ width: size, style: "solid", color: "transparent" }}
      borderTop={{ width: size, style: "solid", color: color }}
    />
  );
}
