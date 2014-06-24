/**
 * @jsx React.DOM
 */
'use strict';

module.exports = {
  render: require('./render'),
  Form: require('./form'),
  elements: require('./elements'),
  widgets: require('./widgets'),
  services: require('./services')
};

if (window) {
  window.Rex = window.Rex || {};
  window.Rex.Forms = module.exports;
}
