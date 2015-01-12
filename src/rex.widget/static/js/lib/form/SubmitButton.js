/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var Button        = require('../Button');
var emptyFunction = require('../emptyFunction');

var SubmitButton = React.createClass({

  render() {
    return <Button {...this.props} onClick={this.onClick} />;
  },

  getDefaultProps() {
    return {
      onClick: emptyFunction,
      onSubmit: emptyFunction
    };
  },

  onClick() {
    if (this.props.onClick()) {
      this.props.onSubmit();
    }
  }
});

module.exports = SubmitButton;

