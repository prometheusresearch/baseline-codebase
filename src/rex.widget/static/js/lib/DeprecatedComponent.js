/**
 * @copyright 2015, Prometheus Research, LLC
 */

let React = require('react');

function makeDeprecatedComponentMixin(message, componentName) {
  let warned = false;
  return {
    componentWillMount() {
      if (!warned) {
        warned = true;
        console.warn(`Component <${componentName || this.type.displayName} /> is deprecated: ${message}`); // eslint-disable-line max-len
      }
    }
  };
}

function DeprecatedComponent(message, componentName) {
  return function DeprecatedComponentDecorator(Component) {
    let displayName = componentName || Component.displayName || Component.name;
    return React.createClass({
      displayName: `DeprecatedComponent(${displayName})`,
      mixins: [makeDeprecatedComponentMixin(message, componentName)],

      render() {
        return <Component {...this.props} />;
      },

    });
  }
}

module.exports = DeprecatedComponent;
module.exports.makeDeprecatedComponentMixin = makeDeprecatedComponentMixin;
