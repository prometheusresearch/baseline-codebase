/**
 * @jsx React.DOM
 */
'use strict';

var React      = require('react');
var _          = require('../localization')._;
var ToggleText = require('./ToggleText');

var explanation = React.createClass({

  render: function () {
    return this.transferPropsTo(
      <ToggleText
        toggleText={_('I would like to explain my response to this question.')}
        label={_('Explanation:')}
      />
    );
  }
});

module.exports = explanation;
