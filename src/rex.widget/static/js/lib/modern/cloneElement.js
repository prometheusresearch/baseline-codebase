/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                           = require('react/addons');
var {cloneWithProps}                = React.addons;

function cloneElement(element, props) {
  if (element) {
    return cloneWithProps(element, props);
  } else {
    return element;
  }
}

module.exports = cloneElement;
