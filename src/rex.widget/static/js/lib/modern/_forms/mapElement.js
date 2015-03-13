/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;

function mapElement(element, func) {
  return React.Children.map(element, function(element) {
    element = func(element);
    if (element && element.props && element.props.children) {
      element = cloneWithProps(element, {
        children: React.Children.map(
          element.props.children,
          function(element) {
            return mapElement(element, func);
          })
      });
    }
    return element;
  });
}

module.exports = mapElement;
