/**
 * @jsx React.DOM
 */
'use strict';

var React = window.React = require('react');

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
function constructComponent(descriptor, state, key) {
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
    // Widget
    if (prop !== null && prop.__type__) {
      props[name] = constructComponent(prop);
    // An array of widgets
    } else if (prop !== null && prop.__children__) {
      props[name] = prop.__children__.map(function(child, key) {
        return constructComponent(child, state, key);
      });
    // Read from state
    } else if (prop !== null && prop.__state_read__) {
      props[name] = state[prop.__state_read__].state;
    // Write to state
    } else if (prop !== null && prop.__state_read_write__) {
      props[name] = state[prop.__state_read_write__].state;
      props[stateWriterName(name)] = makeStateWriter(prop.__state_read_write__);
    } else {
      props[name] = prop;
    }
  }

  var Component = __require__(descriptor.__type__);
  return Component(props);
}

function stateWriterName(name) {
  return 'on' + name[0].toUpperCase() + name.slice(1);
}

function makeStateWriter(key) {
  return function(update) {
    console.debug('state write', key, update);
  }
}

/**
 * Render Rex Widget component descriptor into DOM.
 *
 * @param {Descriptor} descriptor
 * @param {DOMElement?} element
 * @return {ReactComponent}
 */
function renderSpec(spec, element) {
  var state = spec.state;
  var component = constructComponent(spec.widget, state);
  return React.renderComponent(component, element);
}

module.exports = {
  renderSpec,
  constructComponent
};

window.Rex = window.Rex || {};
window.Rex.Widget = module.exports;
