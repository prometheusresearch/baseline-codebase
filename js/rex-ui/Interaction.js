/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactUtil from "./ReactUtil";

export function useHover() {
  let [hover, setHover] = React.useState(false);

  let onMouseEnter = React.useCallback((_e: MouseEvent) => {
    setHover(true);
  }, []);

  let onMouseLeave = React.useCallback((_e: MouseEvent) => {
    setHover(false);
  }, []);

  return { hover, onMouseEnter, onMouseLeave };
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

export default Hoverable;
