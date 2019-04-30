/**
 * @flow
 */

import * as React from "react";
import { Element } from "react-stylesheet";

type HeaderProps = {
  children?: React.Node,
  paddingLeft?: number,
  paddingRight?: number,
  paddingTop?: number,
  paddingBottom?: number
};

export default function Header({
  paddingLeft = 20,
  paddingRight = 20,
  paddingTop = 20,
  paddingBottom = 10,
  children,
  ...props
}: HeaderProps) {
  return (
    <Element
      margin={0}
      paddingTop={paddingTop}
      paddingBottom={paddingBottom}
      paddingLeft={paddingLeft}
      paddingRight={paddingRight}
      Component="h4"
      fontSize="11pt"
      fontWeight={300}
      {...props}
    >
      {children}
    </Element>
  );
}
