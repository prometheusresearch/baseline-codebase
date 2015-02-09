/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var EVENT_NAME = 'rex-widget-layout-resize';

function notifyLayoutChange() {
  var evt = document.createEvent('CustomEvent');
  evt.initCustomEvent(EVENT_NAME, false, false, null);
  window.dispatchEvent(evt);
}

module.exports = notifyLayoutChange;
module.exports.EVENT_NAME = EVENT_NAME;
