/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let React         = require('react');
let emptyFunction = require('./emptyFunction');

module.exports = function Focusable(Component) {

  return React.createClass({

    displayName: `${Component.displayName}Focusable`,

    render() {
      return (
        <Component
          {...this.props}
          focus={this.state.focus}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          />
      );
    },

    getDefaultProps() {
      return {
        onFocus: emptyFunction,
        onBlur: emptyFunction
      };
    },

    getInitialState() {
      return {focus: false};
    },

    onFocus(e) {
      this.setState({focus: true});
      this.props.onFocus(e);
    },

    onBlur(e) {
      this.setState({focus: false});
      this.props.onBlur(e);
    }
  });
};
