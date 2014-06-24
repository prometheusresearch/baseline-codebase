/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var inputText = require('./inputText');

var inputNumber = React.createClass({

  render: function() {
    return this.transferPropsTo(
      <inputText className="rex-forms-inputNumber" inputType="text" />
    );
  }
});

module.exports = inputNumber;
