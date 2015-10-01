/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React        from 'react';
import {EVENT_NAME} from './notifyLayoutChange';

export default function WithDOMSize(Component) {
  let name = Component.displayName || Component.name;
  return class extends React.Component {

    static displayName = `WithDOMSize(${name})`;

    constructor(props) {
      super(props);
      this.state = {DOMSize: null};
    }

    render() {
      return <Component {...this.props} DOMSize={this.state.DOMSize} />;
    }

    componentDidMount() {
      if (this.state.DOMSize === null) {
        this.computeSize();
      }
      window.addEventListener('resize', this.computeSize);
      window.addEventListener(EVENT_NAME, this.computeSize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.computeSize);
      window.removeEventListener(EVENT_NAME, this.computeSize);
    }

    computeSize = () => {
      let node = React.findDOMNode(this);
      let {width, height} = node.getBoundingClientRect();
      this.setState({DOMSize: {width, height}});
    }
  };
}
