/**
 * Hoverable mixin for React components
 *
 *   var Button = React.createClass({
 *     mixins: [Hoverable],
 *
 *     render() {
 *        var {hover} = this.state
 *        return <div {...this.hoverable} />
 *     }
 *   })
 *
 * or more granular approach
 *
 *   var Button = React.createClass({
 *     mixins: [Hoverable],
 *
 *     render() {
 *       return (
 *         <div
 *           onMouseEnter={this.hoverableOnMouseEnter}
 *           onMouseLeave={this.hoverableOnMouseLeave}
 *           />
 *       )
 *     }
 *   })
 *
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Hoverable = {

  getInitialState() {
    return {hover: false};
  },

  componentWillMount() {
    this.hoverable = {
      onMouseEnter: this.hoverableOnMouseEnter,
      onMouseLeave: this.hoverableOnMouseLeave
    };
  },

  componentWillUnmount() {
    this.hoverable = undefined;
  },

  hoverableOnMouseEnter() {
    this.setState({hover: true});
  },

  hoverableOnMouseLeave() {
    this.setState({hover: false});
  }
};

module.exports = Hoverable;
