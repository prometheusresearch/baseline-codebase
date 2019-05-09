/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactUtil from "./ReactUtil";

export function useHover() {
  let [active, setActive] = React.useState(false);

  let onMouseEnter = React.useCallback((_e: MouseEvent) => {
    setActive(true);
  }, []);

  let onMouseLeave = React.useCallback((_e: MouseEvent) => {
    setActive(false);
  }, []);

  return { hover: active, onMouseEnter, onMouseLeave };
}

export function Hoverable<
  P: {
    hover: boolean,
    onMouseEnter?: ?(MouseEvent) => void,
    onMouseLeave?: ?(MouseEvent) => void
  }
>(
  Component: React.AbstractComponent<P>
): React.AbstractComponent<$Diff<P, { hover: boolean }>> {
  let HoverableComponent = React.forwardRef((props, ref) => {
    let { hover, onMouseEnter, onMouseLeave } = useHover();

    return (
      <Component
        {...props}
        ref={ref}
        hover={hover}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  });

  HoverableComponent.displayName =
    ReactUtil.getComponentDisplayName(Component) || "Component";

  return HoverableComponent;
}

export function useFocus() {
  let [active, setActive] = React.useState(false);

  let onFocus = React.useCallback((_e: UIEvent) => {
    setActive(true);
  }, []);

  let onBlur = React.useCallback((_e: UIEvent) => {
    setActive(false);
  }, []);

  return { focus: active, onFocus, onBlur };
}

export function Focusable<
  P: {
    focus: boolean,
    onFocus?: ?(UIEvent) => void,
    onBlur?: ?(UIEvent) => void
  }
>(
  Component: React.AbstractComponent<P>
): React.AbstractComponent<$Diff<P, { focus: boolean }>> {
  let displayName = Component.displayName || Component.name;

  let HoverableComponent = React.forwardRef((props, ref) => {
    let { focus, onFocus, onBlur } = useFocus();

    return (
      <Component
        {...props}
        ref={ref}
        focus={focus}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  });

  HoverableComponent.displayName =
    ReactUtil.getComponentDisplayName(Component) || "Component";

  return HoverableComponent;
}
