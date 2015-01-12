/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var Button        = require('../Button');
var emptyFunction = require('../emptyFunction');

var RemoveButton = React.createClass({

  render() {
    return <Button {...this.props} onClick={this.onClick} />;
  },

  getDefaultProps() {
    return {
      onClick: emptyFunction,
      onRemove: emptyFunction
    };
  },

  onClick() {
    this.props.onRemove();
    this.props.onClick();
  }
});

module.exports = RemoveButton;
