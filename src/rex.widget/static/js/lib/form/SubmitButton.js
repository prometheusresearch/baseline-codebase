/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var Button        = require('../Button');
var emptyFunction = require('../emptyFunction');

var SubmitButton = React.createClass({

  render() {
    var {value: {validation, isDirty}, submitting, ...props} = this.props;
    var disabled = !validation.isSuccess && isDirty || submitting;
    return (
      <Button
        {...props}
        disabled={disabled}
        onClick={this.onClick}
        />
    );
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

