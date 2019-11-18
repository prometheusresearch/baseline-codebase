// @flow

import * as React from "react";
import { type FieldConfig, type FilterConfig } from "rex-ui/rapid";

export type ShowScreen = {|
  type: "show",
  fetch: string,
  id: string,
  fields?: ?(FieldConfig[]),
|};

export type PickScreen = {|
  type: "pick",
  fetch: string,
  title: string,
  description: string,
  fields?: ?(FieldConfig[]),
  filters?: ?(FilterConfig[]),
  onSelect?: (id: string) => ShowScreen,
|};

export type Screen = PickScreen | ShowScreen;

export function eqScreen(a: Screen, b: Screen) {
  return a.type === b.type && a.fetch === b.fetch;
}

type Navigation = {|
  screen: Screen,
  push: Screen => void,
  replace: Screen => void,
  pop: () => void,
|};

export function useNavigation(initialScreen: Screen): Navigation {
  let [stack, setStack] = React.useState<Screen[]>([initialScreen]);

  let replace = (screen: Screen) =>
    setStack(stack => {
      stack = stack.slice(0);
      stack[0] = screen;
      return stack;
    });

  let push = (screen: Screen) =>
    setStack(stack => {
      stack = stack.slice(0);
      stack.unshift(screen);
      return stack;
    });

  let pop = () =>
    setStack(stack => {
      if (stack.length > 1) {
        stack = stack.slice(0);
        stack.shift();
      }
      return stack;
    });

  return React.useMemo(() => {
    return {
      screen: stack[0],
      push,
      replace,
      pop,
    };
  }, [stack]);
}
