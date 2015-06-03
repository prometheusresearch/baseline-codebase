/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react');

function makeDeprecatedComponentMixin(message, componentName) {
  var warned = false;
  return {
    componentWillMount() {
      if (!warned) {
        warned = true;
        console.warn(`Component <${componentName || this.type.displayName} /> is deprecated: ${message}`);
      }
    }
  };
}

function DeprecatedComponent(message, componentName) {
  return function DeprecatedComponentDecorator(Component) {
    return React.createClass({
      displayName: `DeprecatedComponent(${componentName || Component.displayName})`,
      mixins: [makeDeprecatedComponentMixin(message, componentName)],

      render() {
        return <Component {...this.props} />;
      },

    });
  }
}

module.exports = DeprecatedComponent;
module.exports.makeDeprecatedComponentMixin = makeDeprecatedComponentMixin;
