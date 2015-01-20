/**
 * @jsx React.DOM
 */
'use strict';

__webpack_require__.p = __MOUNT_PREFIX__ + __BUNDLE_PREFIX__;

var React            = require('react');
var Storage          = require('./Storage');
var Application      = require('./Application');
var Sitemap          = require('./Sitemap');
var invariant        = require('./invariant');
var Actions          = require('./runtime/Actions');

invariant(
  window.__require__ !== undefined,
  'rex-widget requires introspectable plugin to be enabled, '
  + 'you probably have an old version of rex-setup npm package installed'
);

/**
 * Fix for scroll position.
 */
window.addEventListener('beforeunload', function() {
  window.scrollTo(0, 0);
}, false);

/**
 * Render Rex Widget application into DOM.
 */
function render(spec, element) {
  var {descriptor, state, data, versions} = spec;

  Actions.pageInit({
    stateDescriptor: descriptor.state,
    state, versions, data
  });

  return React.render(
    <Application listenTo={Object.keys(descriptor.state)} ui={descriptor.ui} />,
    element
  );
}

module.exports = {
  render,
  Application,
  Sitemap:            Sitemap,
  request:            require('./request'),
  Reference:          require('./Reference'),
  Link:               require('./Link'),
  History:            require('./History'),
  PropTypes:          require('./PropTypes'),
  Table:              require('./Table'),
  Select:             require('./Select'),
  Grid:               require('./Grid'),
  Preloader:          require('./Preloader'),
  DataPreloader:      require('./DataPreloader'),
  LoadingIndicator:   require('./LoadingIndicator'),
  Icon:               require('./Icon'),
  TextInput:          require('./TextInput'),
  ValidatedTextInput: require('./ValidatedTextInput'),
  Button:             require('./Button'),
  Checkbox:           require('./Checkbox'),
  CheckboxGroup:      require('./CheckboxGroup'),
  Modal:              require('./Modal'),
  Hoverable:          require('./Hoverable'),
  Draggable:          require('./Draggable'),
  layout:             require('./layout'),
  form:               require('./form'),
  PageStateMixin:     require('./PageStateMixin'),

  Text:               require('./Text'),
  Header:             require('./Header'),

  // TODO: expose form using require('./form')
  FormContextMixin:   require('./form/FormContextMixin'),


  merge:              require('./merge'),
  runtime:            require('./runtime')
};

window.Rex = window.Rex || {};
window.Rex.Widget = module.exports;
