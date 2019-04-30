/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import React from "react";

import * as styles from "@material-ui/styles";
import * as mui from "@material-ui/core";
import { type Menu, NavMenuItems } from "./NavMenu";
import { type Theme } from "rex-ui/Theme";

let useStyles = styles.makeStyles((theme: Theme) => {
  return {
    VerticalNavMenuRoot: {
      display: "flex",
      flexDirection: "column",
      width: 300,
      fontSize: "90%"
    },

    VerticalNavMenuSubItemRoot: {
      paddingLeft: "40px !important"
    }
  };
});

let VerticalNavMenuItem = React.forwardRef(
  ({ item, selected, submenu }, ref) => {
    let [isMenuOpen, setMenuOpen] = React.useState(selected);
    let toggleMenuOpen = () => {
      if (isMenuOpen) {
        setMenuOpen(false);
      } else {
        setMenuOpen(true);
      }
    };
    let classes = useStyles();
    return (
      <div>
        <mui.MenuItem
          ref={ref}
          component="a"
          color="inherit"
          key={item.url}
          href={item.url}
          selected={selected}
          onClick={toggleMenuOpen}
        >
          {item.title}
        </mui.MenuItem>
        {isMenuOpen && <mui.MenuList>{submenu}</mui.MenuList>}
      </div>
    );
  }
);

let VerticalNavMenuSubItem = React.forwardRef(({ item, selected }, ref) => {
  let classes = useStyles();
  return (
    <mui.MenuItem
      classes={{ root: classes.VerticalNavMenuSubItemRoot }}
      component="a"
      color="inherit"
      key={item.url}
      href={item.url}
      selected={selected}
    >
      {item.title}
    </mui.MenuItem>
  );
});

type Props = {
  menu: Menu,
  location: Location
};

function VerticalNavMenu({ menu, location }: Props) {
  let classes = useStyles();

  let renderMenuItem = props => <VerticalNavMenuItem {...props} />;
  let renderSubMenuItem = props => <VerticalNavMenuSubItem {...props} />;

  return (
    <mui.MenuList classes={{ root: classes.VerticalNavMenuRoot }}>
      <NavMenuItems
        menu={menu}
        location={location}
        renderMenuItem={renderMenuItem}
        renderSubMenuItem={renderSubMenuItem}
      />
    </mui.MenuList>
  );
}

export default VerticalNavMenu;
