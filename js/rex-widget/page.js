/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from "react";
export { default as DynamicPageContent } from "./DynamicPageContent";

export {
  getLocation,
  subscribeLocationChange,
  unsubscribeLocationChange,
  updateLocation
} from "./PageManager";

type PageContext = Object;

export let pageContext = React.createContext<PageContext>({
  navigationStack: []
});
