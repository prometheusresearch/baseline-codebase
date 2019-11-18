// @flow

import * as React from "react";
import type { FieldConfig, FilterConfig, PickToolbarProps } from "rex-ui/rapid";

export type ShowScreen = {|
  type: "show",
  title: string,
  fetch: string,
  id: string,
  fields?: ?(FieldConfig[]),
|};

export type PickScreen = {|
  type: "pick",
  title: string,
  fetch: string,
  description: string,
  fields?: ?(FieldConfig[]),
  filters?: ?(FilterConfig[]),
  onSelect?: (id: string) => ShowScreen,
  renderToolbar?: PickToolbarProps => React.Node,
|};

export type Screen = PickScreen | ShowScreen;

export function eqScreen(a: Screen, b: Screen) {
  return a.type === b.type && a.fetch === b.fetch;
}

export type Navigation = {|
  screen: Screen,
  isActive: Screen => boolean,
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
    let screen = stack[0];
    let isActive = otherScreen => eqScreen(screen, otherScreen);
    return {
      screen,
      isActive,
      push,
      replace,
      pop,
    };
  }, [stack]);
}
