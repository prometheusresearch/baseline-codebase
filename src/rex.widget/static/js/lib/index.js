/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

if (window.__require__ === undefined) {
  throw new Error(
    'rex-widget requires introspectable plugin to be enabled, '
    + 'you probably have an old version of rex-setup npm package installed'
  );
}

/**
 * Constructor React Component Descriptor from Rex Widget component descriptor.
 *
 * @private
 *
 * @param {Descriptor} descriptor
 * @param {Number|String} key
 * @returns {ReactDescriptor}
 */
function constructComponent(descriptor, key) {
  if (descriptor.__type__ === undefined) {
    throw new Error('descriptor should have "__type__" attribute');
  }

  if (descriptor.props === undefined) {
    throw new Error('descriptor should have "props" attribute');
  }

  var props = {};

  if (key !== undefined) {
    props.key = key;
  }

  for (var name in descriptor.props) {
    var prop = descriptor.props[name];
    if (prop !== null && prop.__type__) {
      props[name] = constructComponent(prop);
    } else if (prop !== null && prop.__children__) {
      props[name] = prop.__children__.map(constructComponent);
    } else {
      props[name] = prop;
    }
  }

  var Component = __require__(descriptor.__type__);
  return Component(props);
}

/**
 * Render Rex Widget component descriptor into DOM.
 *
 * @param {Descriptor} descriptor
 * @param {DOMElement?} element
 * @return {ReactComponent}
 */
function renderDescriptor(descriptor, element) {
  var component = constructComponent(descriptor);
  return React.renderComponent(component, element);
}

module.exports = {
  renderDescriptor,
  constructComponent
};

window.Rex = window.Rex || {};
window.Rex.Widget = module.exports;
