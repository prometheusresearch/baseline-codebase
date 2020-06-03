// @flow

import * as React from "react";
import * as Router from "react-router-dom";
import * as mui from "@material-ui/core";

import * as Route from "./Route";

type AppMenuProps = {|
  onNavigate: () => void,
  routes: Route.RouteWithPosition[],
  route: Route.RouteWithPosition,
|};

export default function AppMenu({ onNavigate, routes, route }: AppMenuProps) {
  let history = Router.useHistory();
  let items = React.useMemo(() => {
    let items = [];

    // Find the root route of the current route.
    let currentRouteRoot = route;
    while (currentRouteRoot.parent != null) {
      currentRouteRoot = currentRouteRoot.parent;
    }

    routes.forEach(routeWithPos => {
      // Only render items for top level routes.
      if (routeWithPos.parent != null) {
        return;
      }
      if (routeWithPos.paramsRequired.length > 0) {
        return;
      }

      let route: Route.Route = routeWithPos.route;
      if (route.type === "screen") {
        // $FlowFixMe: Flow is buggy with refinements for opaque types
        let screen: Route.Screen = route;
        let onClick = () => {
          history.push(routeWithPos.path);
          onNavigate();
        };
        items.push(
          <mui.ListItem
            key={routeWithPos.path}
            button={true}
            selected={routeWithPos === currentRouteRoot}
            onClick={onClick}
          >
            <mui.ListItemText primary={screen.title ?? routeWithPos.path} />
          </mui.ListItem>,
        );
      }
    });
    return items;
  }, [history, onNavigate, routes, route]);

  return <mui.List>{items}</mui.List>;
}
