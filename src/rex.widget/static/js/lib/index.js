/**
 * @jsx React.DOM
 */
'use strict';

__webpack_require__.p = __MOUNT_PREFIX__ + __BUNDLE_PREFIX__;

var React            = require('react');
var ApplicationState = require('./ApplicationState');
var Application      = require('./Application');
var DataPreloader    = require('./DataPreloader');
var PropTypes        = require('./PropTypes');
var Table            = require('./Table');
var Grid             = require('./Grid');

if (window.__require__ === undefined) {
  throw new Error(
    'rex-widget requires introspectable plugin to be enabled, '
    + 'you probably have an old version of rex-setup npm package installed'
  );
}

/**
 * Render Rex Widget spec into DOM.
 *
 * @param {Spec} spec
 * @param {DOMElement?} element
 * @return {ReactComponent}
 */
function renderSpec(spec, element) {
  var stateIDs = Object.keys(spec.state);

  ApplicationState.hydrateAll(spec.state);
  ApplicationState.loadDeferred();

  return React.renderComponent(
    <Application stateIDs={stateIDs} ui={spec.ui} />,
    element);
}

module.exports = {
  renderSpec,
  ApplicationState,
  Application,
  PropTypes,
  Table, Grid, DataPreloader
};

window.Rex = window.Rex || {};
window.Rex.Widget = module.exports;

// Needed for React Dev Tools
if (__DEV__) {
  window.React = React;
}
