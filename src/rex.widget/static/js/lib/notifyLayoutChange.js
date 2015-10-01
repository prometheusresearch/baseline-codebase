/**
 * @copyright 2015, Prometheus Research, LLC
 */

export const EVENT_NAME = 'rex-widget-layout-resize';

export default function notifyLayoutChange() {
  let evt = document.createEvent('CustomEvent');
  evt.initCustomEvent(EVENT_NAME, false, false, null);
  window.dispatchEvent(evt);
}
