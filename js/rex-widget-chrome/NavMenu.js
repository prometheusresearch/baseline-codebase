/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import resolveURL from "rex-widget/resolveURL";
import * as History from "rex-ui/History";

export type Menu = MenuItem[];

export type MenuItem = {
  key: null | string | number,
  url: string,
  title: string,
  items: ?Menu,
  permitted: boolean
};

type Props = {
  menu: Menu,
  location: History.Location,
  renderMenuItem: ({
    item: MenuItem,
    key: string,
    selected: boolean,
    submenu: React.Node,
    href?: string
  }) => React.Node,
  renderSubMenuItem: ({
    item: MenuItem,
    key: string,
    selected: boolean
  }) => React.Node
};

export function NavMenuItems(props: Props) {
  let menu = [];

  let selectedFirst = null;

  for (let i = 0; i < props.menu.length; i++) {
    let itemFirst = props.menu[i];
    let selectedSecond = null;
    selectedFirst = isCurrentLocation(props.location, itemFirst.url);

    if (itemFirst.items) {
      for (let j = 0; j < itemFirst.items.length; j++) {
        let itemSecond = itemFirst.items[j];
        if (isCurrentLocation(props.location, itemSecond.url)) {
          selectedFirst = true;
          selectedSecond = itemSecond.url;
        }
      }
    }
    if (itemFirst.permitted) {
      let submenu = (itemFirst.items || [])
        .filter(item => item.permitted)
        .map(item =>
          props.renderSubMenuItem({
            item: item,
            key: item.url,
            selected: selectedSecond === item.url
          })
        );
      menu.push(
        props.renderMenuItem({
          item: itemFirst,
          key: itemKey(itemFirst),
          selected: selectedFirst,
          submenu: submenu.length > 0 ? submenu : null
        })
      );
    }
  }
  return <>{menu}</>;
}

function isCurrentLocation(location, href) {
  if (href) {
    href = resolveURL(href);
  }
  return window.location.origin + location.pathname === href;
}

function itemKey(item) {
  if (item.key != null) {
    return String(item.key);
  } else if (item.url != null) {
    return item.url;
  } else {
    return item.title;
  }
}
