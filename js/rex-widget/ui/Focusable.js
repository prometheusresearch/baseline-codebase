/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import {emptyFunction} from '../lang';

export default function Focusable(Component) {
  let displayName = Component.displayName || Component.name;

  return class extends React.Component {

    static displayName = `Focusable(${displayName})`;

    static defaultProps = {
      onFocus: emptyFunction,
      onBlur: emptyFunction,
    };

    constructor(props) {
      super(props);
      this.state = {focus: false};
    }

    render() {
      return (
        <Component
          {...this.props}
          focus={this.state.focus}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          />
      );
    }

    onFocus = (e) => {
      this.setState({focus: true});
      this.props.onFocus(e);
    };

    onBlur = (e) => {
      this.setState({focus: false});
      this.props.onBlur(e);
    };
  };
}
