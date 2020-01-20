/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import ResizeObserver from "resize-observer-polyfill";
import * as React from "react";
import * as ReactUtil from "./ReactUtil.js";
import { useTheme } from "./Theme.js";
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery";

export type LayoutMode = "desktop" | "tablet" | "phone";

export function useLayoutMode(): LayoutMode {
  let theme = useTheme();
  let isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  let isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  if (isDesktop) {
    return "desktop";
  } else if (isTablet) {
    return "tablet";
  } else {
    return "phone";
  }
}

/**
 * Compute size of the DOM element.
 *
 * Usage:
 *
 *   let WithSize = (props) => {
 *     let [size, ref] = useDOMSize()
 *
 *     return (
 *       <div ref={ref}>
 *         {size != null ? JSON.stringify(size) : null}
 *       </div>
 *     )
 *   }
 */
export function useDOMSize(): [
  ?{
    width: number,
    height: number,
    left: number,
    right: number,
    top: number,
    bottom: number,
  },
  React.Ref<any>,
] {
  let [size, setSize] = React.useState(null);
  let elementRef = React.useRef(null);
  let observerRef = React.useRef(null);

  // Recalculate dimensions on ResizeObserver callback
  let onResize = entries => {
    let entry = entries[0];
    invariant(
      entry != null,
      "useDOMSize: missing records in ResizeObserver callback",
    );
    invariant(
      entry.target === elementRef.current,
      "useDOMSize: invalid target in ResizeObserver callback entries",
    );
    let { width, height, left, top, bottom, right } = entry.contentRect;
    setSize({ width, height, left, top, bottom, right });
  };

  // Handle element mount/unmount
  let onElement = React.useMemo(
    () => component => {
      let element = ReactUtil.findHTMLElement(component);

      if (elementRef.current === element) {
        // Skip doing work if element is the same.
        return;
      }

      if (element != null) {
        let rect = element.getBoundingClientRect();
        let { width, height, top, right, left, bottom } = rect;
        setSize({ width, height, top, right, bottom, left });

        if (observerRef.current == null) {
          observerRef.current = new ResizeObserver(onResize);
        }
        observerRef.current.observe(element);
        elementRef.current = element;
      } else {
        if (observerRef.current != null && elementRef.current != null) {
          observerRef.current.unobserve(elementRef.current);
        }
        elementRef.current = null;
      }
    },
    [],
  );

  // Tear down ResizeObserver on unmount
  React.useEffect(() => {
    return function cleanup() {
      if (observerRef.current != null) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return [size, onElement];
}

export function WithDOMSize<
  P: {
    setElementForDOMSize: React.Ref<any>,
    DOMSize: ?{ width: number, height: number },
  },
>(
  Component: React.AbstractComponent<P>,
): React.AbstractComponent<
  $Diff<
    P,
    {
      setElementForDOMSize: React.Ref<any>,
      DOMSize: ?{ width: number, height: number },
    },
  >,
> {
  let displayName = ReactUtil.getComponentDisplayName(Component) || "Component";
  function Wrapper(props) {
    let [DOMSize, setElementForDOMSize] = useDOMSize();
    return (
      <Component
        {...props}
        DOMSize={DOMSize}
        setElementForDOMSize={setElementForDOMSize}
      />
    );
  }
  Wrapper.displayName = `WithDOMSize(${displayName})`;
  return Wrapper;
}
