// @flow

/* eslint no-use-before-define: "off" */

import invariant from "invariant";
import * as React from "react";
import * as RR from "react-router-dom";

export opaque type Loc<T>: {
  make: T => string,
} = {| pattern: string, make: T => string |};

export let loc = <T>(params: {|
  pattern: string,
  make: T => string,
|}): Loc<T> => params;

export opaque type Screen<P>: {
  +type: "screen",
  +title: string,
} = {|
  +type: "screen",
  +path: Loc<P>,
  +render: (props: RouteRenderProps<P>) => React.Node,
  +title: string,
  +routes?: Route[],
|};

export opaque type Redirect: {
  +type: "redirect",
} = {|
  +type: "redirect",
  +path: string,
  +to: string,
|};

export type Route = Screen<any> | Redirect;

export type RouteWithPosition = {|
  +route: Route,
  +path: string,
  +paramsRequired: string[],
  +parent?: ?RouteWithPosition,
|};

export type Breadcrumb = {|
  title: string,
  path: string,
|};

type RouteRenderProps<P> = {|
  ...RR.ContextRouter,
  params: P,
  breadcrumbs: Array<Breadcrumb>,
  route: RouteWithPosition,
  routes: RouteWithPosition[],
|};

export function route<P>(cfg: $Diff<Screen<P>, { type: "screen" }>): Screen<P> {
  return { type: "screen", ...cfg };
}

export function redirect(cfg: $Diff<Redirect, { type: "redirect" }>): Redirect {
  return { type: "redirect", ...cfg };
}

type RouterProps = {|
  routes: Route[],
|};

export function Router({ routes: routesConfig }: RouterProps) {
  let children = React.useMemo(() => {
    let routes = buildRoutes(null, [], routesConfig);

    let routeRender = (
      screen: Screen<any>,
      route: RouteWithPosition,
    ) => props => {
      let params = props.match.params;
      let breadcrumbs = buildBreadcrumbs(route, params);
      let node = screen.render({
        ...props,
        params,
        breadcrumbs,
        route,
        routes,
      });
      let info = { breadcrumbs, routes, route };
      return (
        <RouteInfoContext.Provider value={info}>
          {node}
        </RouteInfoContext.Provider>
      );
    };

    return routes.map(routeWithPos => {
      let { route, path } = routeWithPos;
      switch (route.type) {
        case "screen":
          return (
            <RR.Route
              exact={true}
              path={path}
              render={routeRender(route, routeWithPos)}
            />
          );
        case "redirect":
          return <RR.Redirect exact={true} from={path} to={route.to} />;
        default:
          // eslint-disable-next-line no-unused-expressions
          (route.type: empty);
          return invariant(false, "Unknown route type");
      }
    });
  }, [routesConfig]);

  return React.createElement(RR.Switch, null, ...children);
}

function buildRoutes(
  parent: ?RouteWithPosition,
  acc: RouteWithPosition[],
  routes: Route[],
): RouteWithPosition[] {
  routes.forEach(route => {
    let path = route.type === "redirect" ? route.path : route.path.pattern;
    if (route.type === "redirect") {
      let routeWithPos = {
        route,
        path,
        parent,
        paramsRequired: findParams(path),
      };
      acc.push(routeWithPos);
    } else {
      let routeWithPos = {
        route,
        path,
        parent,
        paramsRequired: findParams(path),
      };
      acc.push(routeWithPos);
      let routes = route.routes;
      if (routes != null) {
        buildRoutes(routeWithPos, acc, routes);
      }
    }
  });
  return acc;
}

function buildBreadcrumbs(
  route: RouteWithPosition,
  params: { [name: string]: ?string },
): Array<Breadcrumb> {
  let breadcrumbs: Breadcrumb[] = [];
  let curr = route;
  let paramsKeys = Object.keys(params);
  while (curr != null) {
    if (curr.route.type === "screen") {
      let screen = curr.route;
      let path = paramsKeys.reduce(
        (path, key) => path.replace(`:${key}`, params[key] ?? ""),
        curr.path,
      );
      breadcrumbs.unshift({
        title: screen.title,
        path,
      });
    }
    curr = curr.parent;
  }
  return breadcrumbs;
}

export type RouteInfo = {|
  breadcrumbs: Array<Breadcrumb>,
  route: RouteWithPosition,
  routes: RouteWithPosition[],
|};

let RouteInfoContext = React.createContext<?RouteInfo>(null);

export function useRouteInfo(): RouteInfo {
  let info = React.useContext(RouteInfoContext);
  invariant(info != null, "RouteInfoContext is not provided");
  return info;
}

function findParams(path): string[] {
  PARAM_RE.lastIndex = 0;
  let paramsKeys = [];
  while (true) {
    let m = PARAM_RE.exec(path);
    if (m == null) {
      break;
    }
    paramsKeys.push(m[1]);
  }
  return paramsKeys;
}

let PARAM_RE = /:([a-zA-Z0-9_]+)/g;
