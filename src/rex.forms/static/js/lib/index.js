/**
 * @jsx React.DOM
 */
'use strict';

module.exports = {
  render: require('./render'),
  Form: require('./form').Form,
  elements: require('./elements'),
  widgets: require('./widgets'),
  services: require('./services'),
  reconciler: require('./reconciler'),
  widgetTypes: require('./elements/widgetTypes'),
  readOnlyWidgetTypes: require('./elements/readOnlyWidgetTypes')
};

if (window) {
  window.Rex = window.Rex || {};
  window.Rex.Forms = module.exports;
}
