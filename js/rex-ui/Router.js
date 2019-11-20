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

export type Route<+T> = {|
  +path: RoutePattern.pattern,
  +screen?: T,
  +children?: $ReadOnlyArray<Route<T>>,
|};

export opaque type Router<T>: {
  push: (route: Route<T>, param?: Params) => void,
  replace: (route: Route<T>, params?: Params) => void,
  pop: () => void,
  isActive: (route: Route<T>, params?: Params) => boolean,
} = {|
  push: (route: Route<T>, param?: Params) => void,
  replace: (route: Route<T>, params?: Params) => void,
  pop: () => void,
  isActive: (route: Route<T>, params?: Params) => boolean,

  pairs: [RoutePattern.pattern, RoutePattern.compiledPattern, Route<T>, T][],
  index: Map<Route<T> | T, RoutePattern.compiledPattern>,
  history: History.BrowserHistory,
|};

export type Params = { [name: string]: string };

export type Match<+T> = {|
  +route: Route<T>,
  +screen: T,
  +params: Params,
|};

export function make<T>(
  routes: Route<T>[],
  options?: {| basename?: ?string |},
): Router<T> {
  let pairs = [];
  let index: Map<Route<T> | T, RoutePattern.compiledPattern> = new Map();

  let visit = routes.map(route => [[], route]);
  while (visit.length > 0) {
    let [prefix, route] = visit.shift();
    let segments = [...prefix, route.path];
    if (route.screen != null) {
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

  let push = (route: Route<T>, params) => {
    console.log('push', route, params);
    let pattern = index.get(route);
    if (pattern == null) {
      console.error("Unknown route:", route);
      invariant(false, "Unknown route: %s", route);
    }
    let pathname = RoutePattern.pathname(pattern, params || {});
    history.push(pathname);
  };

  let replace = (route: Route<T>, params) => {
    console.log('replace', route, params);
    let pattern = index.get(route);
    if (pattern == null) {
      console.error("Unknown route:", route);
      invariant(false, "Unknown route: %s", route);
    }
    let pathname = RoutePattern.pathname(pattern, params || {});
    history.replace(pathname);
  };

  let pop = () => {
    console.log('pop');
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

  return {
    push,
    replace,
    pop,
    isActive,

    pairs,
    index,
    history,
  };
}

export function match<T>(router: Router<T>, loc?: History.Location): ?Match<T> {
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

export function useMatch<T>(router: Router<T>): ?Match<T> {
  let [matched, setMatched] = React.useState<?Match<T>>(() => match(router));
  React.useEffect(
    () =>
      router.history.listen(location => setMatched(match(router, location))),
    [],
  );
  return matched;
}
