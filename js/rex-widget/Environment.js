/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

export let isTouchDevice =
  (document &&
    document.documentElement &&
    "ontouchstart" in document.documentElement) ||
  "onmsgesturechange" in window;
