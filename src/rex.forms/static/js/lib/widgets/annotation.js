/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var ToggleText  = require('./ToggleText');
var _           = require('../localization')._;

var annotation = React.createClass({

  render: function() {
    var text = _("I can't (or won't) respond to this question.");
    var label = _(
      "Please explain why you can't or won't respond to this question:"
    );
    return this.transferPropsTo(
      <ToggleText
        required={this.props.required}
        toggleText={text}
        label={label}
        />
    );
  }
});

module.exports = annotation;
