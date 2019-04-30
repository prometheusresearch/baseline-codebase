/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import React from "react";

import * as styles from "@material-ui/styles";
import * as mui from "@material-ui/core";
import { ThemeProvider } from "rex-ui/Theme.js";
import { type Menu, NavMenuItems } from "./NavMenu.js";

let useStyles = styles.makeStyles({
  HorizontalNavMenuRoot: {
    display: "flex",
    flexDirection: "row"
  },

  HorizontalMavMenuItemRoot: {
    // TODO: get rid of !important
    color: "inherit !important",
    overflow: "visible !important",
    // TODO: get border radius from theme
    borderRadius: "4px !important"
  },
  HorizontalMavMenuItemMenu: {
    // TODO: get color from theme
    backgroundColor: "#3f51b5 !important",
    minWidth: "200px !important"
  },
  HorizontalMavMenuItemMenuItem: {
    color: "white !important",
    fontSize: "85% !important"
  }
});

let HorizontalMavMenuItem = React.forwardRef((props, ref) => {
  let [anchorEl, setAnchorEl] = React.useState(null);
  let open = Boolean(anchorEl);
  let classes = useStyles();

  let handlePopoverClose = () => {
    setAnchorEl(null);
  };

  let handlePopoverOpen = event => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <mui.MenuItem
      ref={ref}
      component={props.href != null ? "a" : "button"}
      selected={props.selected}
      classes={{ root: classes.HorizontalMavMenuItemRoot }}
      href={props.url}
      onMouseEnter={handlePopoverOpen}
      onMouseLeave={handlePopoverClose}
    >
      {props.title}
      <mui.Popper
        open={open}
        placement="bottom-start"
        anchorEl={anchorEl}
        style={{ zIndex: 1000 }}
      >
        <ThemeProvider>
          <mui.Paper
            elevation={2}
            classes={{ root: classes.HorizontalMavMenuItemMenu }}
          >
            <mui.MenuList>{props.menu}</mui.MenuList>
          </mui.Paper>
        </ThemeProvider>
      </mui.Popper>
    </mui.MenuItem>
  );
});

type Props = {
  menu: Menu,
  location: Location
};

function HorizontalNavMenu({ menu, location }: Props) {
  let classes = useStyles();

  let renderMenuItem = ({ item, submenu, selected, key, href }) => {
    return (
      <HorizontalMavMenuItem
        title={item.title}
        menu={submenu}
        url={item.url}
        key={key}
        selected={selected}
        href={href}
      />
    );
  };

  let renderSubMenuItem = ({ item, selected, key }) => {
    return (
      <mui.MenuItem
        component="a"
        color="white"
        key={item.url}
        href={item.url}
        classes={{ root: classes.HorizontalMavMenuItemMenuItem }}
        selected={selected}
      >
        {item.title}
      </mui.MenuItem>
    );
  };

  return (
    <mui.MenuList classes={{ root: classes.HorizontalNavMenuRoot }}>
      <NavMenuItems
        menu={menu}
        location={location}
        renderMenuItem={renderMenuItem}
        renderSubMenuItem={renderSubMenuItem}
      />
    </mui.MenuList>
  );
}

export default HorizontalNavMenu;
