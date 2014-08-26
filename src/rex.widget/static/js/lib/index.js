/**
 * @jsx React.DOM
 */
'use strict';

__webpack_require__.p = __MOUNT_PREFIX__ + __BUNDLE_PREFIX__;

var React            = require('react');
var ApplicationState = require('./ApplicationState');
var Application      = require('./Application');
var invariant        = require('./invariant');

if (__DEV__) {
  // Needed for React Dev Tools
  window.React = React;
}

invariant(
  window.__require__ !== undefined,
  'rex-widget requires introspectable plugin to be enabled, '
  + 'you probably have an old version of rex-setup npm package installed'
);

/**
 * Render Rex Widget application into DOM.
 */
function render({descriptor: {state, ui}, values}, element) {
  ApplicationState.start(state, values);
  return React.renderComponent(
    <Application listenTo={Object.keys(state)} ui={ui} />,
    element);
}

module.exports = {
  render,
  ApplicationState,
  Application,
  History:          require('./History'),
  PropTypes:        require('./PropTypes'),
  Table:            require('./Table'),
  Grid:             require('./Grid'),
  DataPreloader:    require('./DataPreloader'),
  LoadingIndicator: require('./LoadingIndicator'),
  Icon:             require('./Icon')
};

window.Rex = window.Rex || {};
window.Rex.Widget = module.exports;
