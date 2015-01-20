/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Hoverable = {

  getInitialState() {
    return {hover: false};
  },

  onMouseEnter() {
    this.setState({hover: true});
  },

  onMouseLeave() {
    this.setState({hover: false});
  }
};

module.exports = Hoverable;
