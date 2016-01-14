/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default function dispatchResizeEvent() {
  requestAnimationFrame(() => {
    let event = document.createEvent('UIEvents');
    event.initUIEvent('resize', true, false, window, 0);
    window.dispatchEvent(event);
  });
}
