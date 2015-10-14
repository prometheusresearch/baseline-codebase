/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind     from 'autobind-decorator';
import React        from 'react';
import {EVENT_NAME} from './notifyLayoutChange';

export default function WithDOMSize(Component) {
  let name = Component.displayName || Component.name;
  return class extends React.Component {

    static displayName = `WithDOMSize(${name})`;

    static defaultProps = {

      getDOMNode(component) {
        return React.findDOMNode(component);
      }
    };

    constructor(props) {
      super(props);
      this.state = {DOMSize: null};
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
      window.addEventListener(EVENT_NAME, this.computeSize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.computeSize);
      window.removeEventListener(EVENT_NAME, this.computeSize);
    }

    @autobind
    computeSize() {
      let node = this.props.getDOMNode(this);
      let {width, height} = node.getBoundingClientRect();
      this.setState({DOMSize: {width, height}});
    }
  };
}
