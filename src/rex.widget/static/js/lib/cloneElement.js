/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react');

function cloneElement(element, props, defaultProps) {
  if (Array.isArray(element)) {
    return element.map(e => cloneElement(e, props, defaultProps));
  }
  if (element) {
    if (defaultProps) {
      props = {...props};
      for (var name in defaultProps) {
        if (element.props[name] === undefined) {
          props[name] = defaultProps[name];
        }
      }
    }
    return React.cloneElement(element, props);
  } else {
    return element;
  }
}

module.exports = cloneElement;
