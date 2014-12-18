/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var Select = require('./Select');

var ELEMENT_TYPES = ['question', 'header', 'text', 'divider'];

var FieldTypeSelect = React.createClass({

  render: function() {
    var options = [];
    for (var i in ELEMENT_TYPES) {
      var type = ELEMENT_TYPES[i];
      options.push({
        id: type,
        title: type
      });
    }
    return this.transferPropsTo(
      <Select options={options} emptyValue={null} />
    );
  }
});

module.exports = FieldTypeSelect;
