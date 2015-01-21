/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Hoverable = {

  getInitialState() {
    return {hover: false};
  },

  componentWillMount() {
    this.hoverable = {
      onMouseEnter: this.onMouseEnter,
      onMouseLeave: this.onMouseLeave
    };
  },

  componentWillUnmount() {
    this.hoverable = undefined;
  },

  onMouseEnter() {
    this.setState({hover: true});
  },

  onMouseLeave() {
    this.setState({hover: false});
  }
};

module.exports = Hoverable;
