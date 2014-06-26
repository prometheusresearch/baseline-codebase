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
  reconciler: require('./reconciler')
};

if (window) {
  window.Rex = window.Rex || {};
  window.Rex.Forms = module.exports;
}
