/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react/addons');

function WithDOMSize(Component) {
  return React.createClass({

    displayName: `WithDOMSize(${Component.displayName || Component.name})`,

    render() {
      return (
        <Component
          {...this.props}
          DOMSize={this.state.DOMSize}
          />
      );
    },

    getInitialState() {
      return {DOMSize: null};
    },

    componentDidMount() {
      if (this.state.DOMSize === null) {
        this.computeSize();
      }
      window.addEventListener('resize', this.computeSize);
    },

    componentWillUnmount() {
      window.removeEventListener('resize', this.computeSize);
    },

    onWindowResize() {
      this.computeSize();
    },

    computeSize() {
      var node = this.getDOMNode();
      var {width, height} = node.getBoundingClientRect();
      this.setState({DOMSize: {width, height}});
    }
  });
};


module.exports = WithDOMSize;
