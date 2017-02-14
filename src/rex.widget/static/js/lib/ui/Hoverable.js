/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {emptyFunction} from '../lang';

export default function Hoverable(Component) {
  let displayName = Component.displayName || Component.name;

  return class extends React.Component {

    static displayName = `Hoverable(${displayName})`;

    static defaultProps = {
      onMouseEnter: emptyFunction,
      onMouseLeave: emptyFunction
    };

    constructor(props) {
      super(props);
      this.state = {hover: false};
    }

    render() {
      return (
        <Component
          {...this.props}
          hover={this.state.hover}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          />
      );
    }

    onMouseEnter = (e) => {
      this.setState({hover: true});
      this.props.onMouseEnter(e); // eslint-disable-line react/prop-types
    };

    onMouseLeave = (e) => {
      this.setState({hover: false});
      this.props.onMouseLeave(e); // eslint-disable-line react/prop-types
    };
  };
}
