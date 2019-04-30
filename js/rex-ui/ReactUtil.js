/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";

/**
 * Set value for the React ref.
 *
 * TODO: I think React should provide this instead. Otherwise composing refs is
 * a pain.
 */
export function setReactRef<T: React.AbstractComponent<*>>(
  ref: React.Ref<T> | null,
  instance: T | null
) {
  if (typeof ref === "function") {
    ref(instance);
  } else if (typeof ref === "string" || typeof ref === "number") {
    throw new Error("setReactRef: cannot be used with string ref");
  } else if (ref != null) {
    ref.current = instance;
  }
}

export function findHTMLElement(
  component: null | HTMLElement | React.Component<mixed>
) {
  if (component == null) {
    return null;
  }
  let element = ReactDOM.findDOMNode(component);
  invariant(
    element instanceof HTMLElement,
    "findHTMLElement: expected HTMLElement but got %s",
    element
  );
  return element;
}

export function getComponentDisplayName<T>(
  ComponentType: React.AbstractComponent<T>
): string | null {
  let displayName = null;
  if (ComponentType.displayName != null) {
    displayName = ComponentType.displayName;
  } else if (ComponentType.name != null) {
    displayName = ComponentType.name;
  }
  return displayName;
}

/**
 * Function which returns true if object is a valid React element.
 */
export function isReactElement(obj: mixed): boolean %checks {
  return (
    obj != null &&
    typeof obj === "object" &&
    obj.type != null &&
    obj.props != null
  );
}
