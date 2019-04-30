/**
 * @flow
 */

import * as React from "react";
import { style, css, Element, VBox, HBox } from "react-stylesheet";

type MenuButtonSecondaryProps = {
  icon?: React.Node,
  tabIndex?: number,
  children?: React.Node,
  onClick?: () => *
};

export default class MenuButtonSecondary extends React.Component<MenuButtonSecondaryProps> {
  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    if (this.props.onClick) {
      this.props.onClick();
    }
  };

  render() {
    let { icon, children, tabIndex = 0, ...rest } = this.props;
    return (
      <MenuButtonSecondaryRoot
        {...rest}
        onClick={this.onClick}
        tabIndex={tabIndex}
      >
        {icon && (
          <VBox width={15} paddingRight={20} justifyContent="flex-start">
            {icon}
          </VBox>
        )}
        <Element overflow="hidden" textOverflow="ellipsis">
          {children}
        </Element>
      </MenuButtonSecondaryRoot>
    );
  }
}

let MenuButtonSecondaryRoot = style(HBox, {
  displayName: "MenuButtonSecondaryRoot",
  base: {
    whiteSpace: "nowrap",
    outline: css.none,
    height: "33px",
    cursor: "default",
    fontSize: "10pt",
    fontWeight: 200,
    borderBottom: css.border(1, "#ddd"),
    userSelect: "none",
    padding: 8,
    paddingLeft: 40,
    paddingRight: 10,
    color: "#666",
    backgroundColor: "#f2f2f2",
    lastOfType: {
      borderBottom: css.none
    },
    hover: {
      color: "#222",
      backgroundColor: "#e7e7e7"
    }
  }
});
