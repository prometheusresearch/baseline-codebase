/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { useDOMSize } from "rex-ui/Layout";
import { VBox } from "react-stylesheet";

export type layout = "horizontal" | "vertical";

export let Context = React.createContext<layout>("horizontal");

/**
 * Determine form layout by measuring form root element.
 */
export function useComputeFormLayout(): [layout, React.Ref<any>] {
  let [size, ref] = useDOMSize();
  let layout: layout = "horizontal";
  if (size != null && size.width < 600) {
    layout = "vertical";
  }
  return [layout, ref];
}

type maxWidth = number | string;

type Props = {|
  layout?: layout,
  children: React.Node,
  Component?: React.AbstractComponent<any>,
  maxWidth?: maxWidth
|};

/**
 * This components provides neccessary layout for form elements.
 *
 * Use it as a form root component:
 *
 *   <FormLayout>
 *     {fields}
 *   </FormLayout>
 *
 * By default it measures root DOM element and decides to render it either in
 * horizontal or vertical layout. You can use `layout` prop to override that
 * behaviour.
 */
export function FormLayout({
  children,
  layout,
  Component,
  maxWidth,
}: Props) {
  let [computedLayout, ref] = useComputeFormLayout();
  if (layout == null) {
    layout = computedLayout;
  }
  if (Component == null) {
    Component = VBox;
  }
  if (maxWidth == null) {
    maxWidth = 550;
  }
  return (
    <Context.Provider value={layout}>
      <Component style={{ maxWidth }} ref={ref}>
        {children}
      </Component>
    </Context.Provider>
  );
}

/**
 * Query for the currently configured form layout.
 *
 * Use it when developing custom form components (such as fields) to adapt to
 * the current viewport.
 */
export function useFormLayout() {
  return React.useContext(Context);
}
