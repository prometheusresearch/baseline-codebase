/**
 * @copyright 2015, Prometheus Research, LLC
 */

export let isTouchDevice = (
  'ontouchstart' in document.documentElement ||
  'onmsgesturechange' in window
);
