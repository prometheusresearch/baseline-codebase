/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';

const DEFAULT_OPTIONS = {};

export default function WithDOMSize(Component, options = DEFAULT_OPTIONS) {
  // if (typeof Component !== 'function' && options === DEFAULT_OPTIONS) {
  //   options = Component;
  //   return function WithDOMSize_decorator(Component) { // eslint-disable-line camelcase
  //     return WithDOMSize(Component, options);
  //   };
  // }
  let name = Component.displayName || Component.name;
  return class extends React.Component {

    static displayName = `WithDOMSize(${name})`;

    static defaultProps = {

      getDOMNode(component) {
        return ReactDOM.findDOMNode(component);
      }
    };

    constructor(props) {
      super(props);
      this.state = {DOMSize: null};
      this._timedOut = false;
    }

    render() {
      return (
        <Component
          {...this.props}
          DOMSize={this.state.DOMSize}
          getDOMNode={undefined} />
      );
    }

    componentDidMount() {
      if (this.state.DOMSize === null) {
        this.computeSize();
      }
      window.addEventListener('resize', this.computeSize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.computeSize);
    }

    computeSize = () => {
      let node = this.props.getDOMNode(this);
      let {width, height} = node.getBoundingClientRect();
      if ((options.forceAsync || height === 0) && !this._timedOut) {
        this._timedOut = true;
        setTimeout(this.computeSize, 0);
      } else {
        this.setState({DOMSize: {width, height}});
      }
    };
  };
}
