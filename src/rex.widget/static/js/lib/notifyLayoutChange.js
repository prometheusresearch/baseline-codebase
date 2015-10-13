/**
 * @copyright 2015, Prometheus Research, LLC
 */

export const EVENT_NAME = 'rex-widget-layout-resize';

export default function notifyLayoutChange() {
  let event = document.createEvent('Event');
  event.initEvent(EVENT_NAME, true, false);
  window.dispatchEvent(event);
}
