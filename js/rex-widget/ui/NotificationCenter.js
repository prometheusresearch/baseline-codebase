/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as rexui from "rex-ui";

export opaque type NotificationID = number;
export type Item = {
  id: NotificationID,
  node: React.Node,
  ttl?: number
};

let _notificationID: NotificationID = 0;

let _layer: ?HTMLElement = null;

function getLayer(): HTMLElement {
  if (_layer != null) {
    return _layer;
  }
  _layer = document.createElement("div");
  invariant(document.body != null, "DOM is not available");
  document.body.appendChild(_layer);
  return _layer;
}

let NotificationLayerStyle = {
  self: {
    position: "fixed",
    zIndex: 10000,
    top: 0,
    right: 0,
    width: "30%",
    padding: 15
  }
};

type Props = {
  items: Item[]
};

export let NotificationLayer = ({ items }: Props) => {
  // Timers

  let timersRef = React.useRef({});

  // cleanup all times on unmount
  React.useEffect(
    () => () => {
      let timers = timersRef.current;
      if (timers == null) {
        return;
      }
      for (let id in timers) {
        clearTimeout(timers[id]);
      }
      timersRef.current = null;
    },
    []
  );

  // schedule any new items for deletion
  React.useEffect(() => {
    let timers = timersRef.current;
    if (timers == null) {
      return;
    }
    for (let item of items) {
      if (timers[item.id] != null) {
        continue;
      }
      let ttl = item.ttl || 2000;
      if (ttl === Infinity) {
        continue;
      }
      timers[item.id] = setTimeout(() => {
        removeNotification(item.id);
        delete timers[item.id];
      }, ttl);
    }
  });

  // API

  let showNotification = (notification: Notification) => {};

  let elements = items.map(item => (
    <div
      key={item.id}
      style={{ marginBottom: 24 }}
      onClick={() => removeNotification(item.id)}
    >
      {item.node}
    </div>
  ));

  return (
    <rexui.ThemeProvider>
      <div style={NotificationLayerStyle.self}>{elements}</div>
    </rexui.ThemeProvider>
  );
};

function indexOf(id, items: Item[]) {
  for (let i = 0, len = items.length; i < len; i++) {
    if (items[i].id === id) {
      return i;
    }
  }
  return -1;
}

let items: Item[] = [];

export function showNotification(
  notification: React.Node,
  ttl?: number
): NotificationID {
  _notificationID = _notificationID + 1;
  let id = _notificationID;
  items = items.concat({
    id,
    node: notification,
    ttl
  });
  ReactDOM.render(<NotificationLayer items={items} />, getLayer());
  return id;
}

export function removeNotification(id: NotificationID) {
  let idx = indexOf(id, items);
  if (idx > -1) {
    items = items.slice(0);
    items.splice(idx, 1);
  }
  ReactDOM.render(<NotificationLayer items={items} />, getLayer());
}
