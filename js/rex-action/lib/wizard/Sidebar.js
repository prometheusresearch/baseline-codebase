/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import classnames from "classnames";
import * as styles from "@material-ui/styles";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";

import * as React from "react";
import { css, boxStyle } from "react-stylesheet";
import { type Position } from "../model/types";

import ActionTitle, { getTitleAtPosition } from "../ActionTitle";
import ActionIcon from "../ActionIcon";

const SIDEBAR_COLLAPSED_KEY = "rex.action.sidebar.collapsed";

let useStyles = styles.makeStyles(theme => ({
  SidebarRoot: {
    ...boxStyle,
    boxSizing: "border-box",
    flexDirection: "column",
    width: 250,
    padding: css.padding(10, 0),
    overflow: "auto"
  },
  SidebarCollapsed: {
    width: "auto"
  },
  SidebarToolbar: {
    ...boxStyle,
    flexDirection: "column",
    flexGrow: 1,
    overflowX: "hidden",
    overflowY: "auto"
  },
  SidebarCollapseButton: {
    padding: "16px"
  },
  SidebarButtonIconCollapsed: {
    marginRight: "0 !important"
  }
}));

function getSidebarKey() {
  return SIDEBAR_COLLAPSED_KEY + "." + window.location.pathname;
}

function readState(key, defaultValue) {
  let value = localStorage.getItem(key);
  return value != null ? JSON.parse(value) : defaultValue;
}

function writeState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

type Props = {
  currentPosition: Position,
  positions: Position[],
  onClick: (string) => void
};

export default function Sidebar(props: Props) {
  let [collapsed, setCollapsed] = React.useState(
    readState(getSidebarKey(), false)
  );

  let classes = useStyles();
  let { onClick, currentPosition, positions } = props;

  let toggle = () => {
    const nextCollapsed = !collapsed;
    writeState(getSidebarKey(), nextCollapsed);
    setCollapsed(nextCollapsed);
  };

  let buttons = positions.map(pos => (
    <mui.MenuItem
      style={{
        fontSize: "90%",
        justifyContent: collapsed ? "center" : "flex-start"
      }}
      key={pos.instruction.action.id}
      title={getTitleAtPosition(pos)}
      selected={
        pos.instruction.action.id === currentPosition.instruction.action.id
      }
      onClick={onClick.bind(null, pos.instruction.action.id)}
    >
      <mui.ListItemIcon
        classes={{
          root: classnames({ [classes.SidebarButtonIconCollapsed]: collapsed })
        }}
      >
        <ActionIcon position={pos} />
      </mui.ListItemIcon>
      {collapsed ? null : <ActionTitle noRichTitle position={pos} />}
    </mui.MenuItem>
  ));
  return (
    <mui.Paper
      square={true}
      classes={{
        root: classnames({
          [classes.SidebarRoot]: true,
          [classes.SidebarCollapsed]: collapsed
        })
      }}
    >
      <mui.MenuList classes={{ root: classes.SidebarToolbar }}>
        {buttons}
      </mui.MenuList>
      <mui.MenuList>
        <mui.MenuItem title="Toggle sidebar" onClick={toggle}>
          <mui.ListItemIcon
            classes={{
              root: classnames({
                [classes.SidebarButtonIconCollapsed]: collapsed
              })
            }}
          >
            {collapsed
              ? <icons.KeyboardArrowRight />
              : <icons.KeyboardArrowLeft />}
          </mui.ListItemIcon>
        </mui.MenuItem>
      </mui.MenuList>
    </mui.Paper>
  );
}
