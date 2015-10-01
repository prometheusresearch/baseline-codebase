/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let React = require('react');

function cloneElement(element, props, defaultProps) {
  if (Array.isArray(element)) {
    return element.map(e => cloneElement(e, props, defaultProps));
  }
  if (element) {
    if (defaultProps) {
      props = {...props};
      for (let name in defaultProps) {
        if (element.props[name] === undefined) { // eslint-disable-line max-depth
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
