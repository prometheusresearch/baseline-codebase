/**
 * Matcher code is based on https://github.com/molefrog/wouter/master/matcher.js
 * which is licensed with ISC.
 *
 * @flow
 */

import invariant from "invariant";
import * as History from "history";
import * as React from "react";
import * as RoutePattern from "./RoutePattern.js";
import * as Rapid from "./rapid";

export type ShowScreen = {|
  type: "show",
  title: string,
  fetch: string,
  fields?: ?(Rapid.FieldConfig[]),
  RenderTitle?: ?Rapid.ShowRenderTitle,
|};

export type PickScreen = {|
  type: "pick",
  title: string,
  fetch: string,
  description: string,
  fields?: ?(Rapid.FieldConfig[]),
  filters?: ?(Rapid.PickFilterConfig[]),
  onSelect?: (id: string) => [Route, Params],
  RenderToolbar?: Rapid.PickRenderToolbar,
|};

export type CustomScreen = {|
  type: "custom",
  title: string,
  Render: React.AbstractComponent<{| params: Object |}>,
|};

export type Screen = PickScreen | ShowScreen | CustomScreen;

export opaque type RouteGroup: {
  +type: "route-group",
  +path: RoutePattern.pattern,
  +children: $ReadOnlyArray<Route>,
} = {|
  +type: "route-group",
  +path: RoutePattern.pattern,
  +children: $ReadOnlyArray<Route>,
|};

export opaque type Route: {
  +type: "route",
  +path: RoutePattern.pattern,
  +screen: Screen,
} = {|
  +type: "route",
  +path: RoutePattern.pattern,
  +screen: Screen,
  +children?: $ReadOnlyArray<Route>,
|};

export opaque type Router: {
  push: (route: Route, param?: Params) => void,
  replace: (route: Route, params?: Params) => void,
  pop: () => void,
  isActive: (route: Route, params?: Params) => boolean,
  routes: Route[],
} = {|
  push: (route: Route, param?: Params) => void,
  replace: (route: Route, params?: Params) => void,
  pop: () => void,
  isActive: (route: Route, params?: Params) => boolean,
  routes: Route[],

  pairs: [RoutePattern.pattern, RoutePattern.compiledPattern, Route, Screen][],
  index: Map<Route | Screen, RoutePattern.compiledPattern>,
  history: History.BrowserHistory,
|};

export type Params = { [name: string]: string };

export type Match = {|
  +route: Route,
  +screen: Screen,
  +params: Params,
|};

export function route(
  path: string,
  screen: Screen,
  ...children: Route[]
): Route {
  return {
    type: "route",
    path,
    screen,
    children,
  };
}

export function group(path: string, ...children: Route[]): RouteGroup {
  return {
    type: "route-group",
    path,
    children,
  };
}

export function make(
  routes: Array<Route | RouteGroup>,
  options?: {| basename?: ?string |},
): Router {
  let pairs = [];
  let index: Map<Route | Screen, RoutePattern.compiledPattern> = new Map();

  let visit = routes.map(route => [[], route]);
  while (visit.length > 0) {
    let [prefix, route] = visit.shift();
    let segments = [...prefix, route.path];
    if (route.type === "route") {
      let screen = route.screen;
      let pattern = RoutePattern.concat(segments);
      let compiledPattern = RoutePattern.compile(pattern);
      pairs.push([pattern, compiledPattern, route, screen]);
      index.set(screen, compiledPattern);
      index.set(route, compiledPattern);
    }
    if (route.children != null) {
      visit.unshift(...route.children.map(route => [segments, route]));
    }
  }

  let basename = "";
  if (options != null && options.basename != null) {
    basename = options.basename;
  }

  let history = History.createBrowserHistory({ basename });

  let push = (route: Route, params) => {
    console.log("push", route, params);
    let pattern = index.get(route);
    if (pattern == null) {
      console.error("Unknown route:", route);
      invariant(false, "Unknown route: %s", route);
    }
    let pathname = RoutePattern.pathname(pattern, params || {});
    history.push(pathname);
  };

  let replace = (route: Route, params) => {
    console.log("replace", route, params);
    let pattern = index.get(route);
    if (pattern == null) {
      console.error("Unknown route:", route);
      invariant(false, "Unknown route: %s", route);
    }
    let pathname = RoutePattern.pathname(pattern, params || {});
    history.replace(pathname);
  };

  let pop = () => {
    console.log("pop");
    history.goBack();
  };

  let isActive = (route, params) => {
    let pattern = index.get(route);
    if (pattern == null) {
      console.error("Unknown route:", route);
      invariant(false, "Unknown route: %s", route);
    }
    let pathname = RoutePattern.pathname(pattern, params || {});
    return pathname === history.location.pathname;
  };

  let onlyRoutes: Route[] = [];
  for (let [_1, _2, route, _screen] of pairs) {
    onlyRoutes.push(route);
  }

  return {
    push,
    replace,
    pop,
    isActive,
    routes: onlyRoutes,

    pairs,
    index,
    history,
  };
}

export function match(router: Router, loc?: History.Location): ?Match {
  if (loc == null) {
    loc = router.history.location;
  }
  for (let i = 0; i < router.pairs.length; i++) {
    let [_, pattern, route, screen] = router.pairs[i];
    let params = RoutePattern.match(pattern, loc.pathname);
    if (params != null) {
      return { route, screen, params };
    }
  }
  return null;
}

export function useMatch(router: Router): ?Match {
  let [matched, setMatched] = React.useState<?Match>(() => match(router));
  React.useEffect(
    () =>
      router.history.listen(location => setMatched(match(router, location))),
    [],
  );
  return matched;
}
