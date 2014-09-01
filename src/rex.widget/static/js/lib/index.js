/**
 * @jsx React.DOM
 */
'use strict';

__webpack_require__.p = __MOUNT_PREFIX__ + __BUNDLE_PREFIX__;

var React            = require('react');
var ApplicationState = require('./ApplicationState');
var ApplicationMap   = require('./ApplicationMap');
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
function render({descriptor: {state, ui}, map, values}, element) {
  ApplicationState.start(state, values);
  ApplicationMap.configure(map);
  return React.renderComponent(
    <Application listenTo={Object.keys(state)} ui={ui} />,
    element);
}

module.exports = {
  render,
  ApplicationState,
  Application,
  link:             ApplicationMap.link,
  linkUnsafe:       ApplicationMap.linkUnsafe,
  Link:             require('./Link'),
  History:          require('./History'),
  PropTypes:        require('./PropTypes'),
  Table:            require('./Table'),
  Select:           require('./Select'),
  Grid:             require('./Grid'),
  Preloader:        require('./Preloader'),
  DataPreloader:    require('./DataPreloader'),
  LoadingIndicator: require('./LoadingIndicator'),
  Icon:             require('./Icon'),
  TextInput:        require('./TextInput'),
  Button:           require('./Button'),
  Checkbox:         require('./Checkbox'),
  CheckboxGroup:    require('./CheckboxGroup'),
  Filters:          require('./Filters'),
  Filter:           require('./Filter')
};

window.Rex = window.Rex || {};
window.Rex.Widget = module.exports;
