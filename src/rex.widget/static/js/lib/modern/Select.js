/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var BaseSelect  = require('../Select');
var {VBox}      = require('./Layout');

var Select = React.createClass({
  
  render() {
    var {noEmptyValue, data, value, onChange, ...props} = this.props;
    return (
      <VBox {...props}>
        <BaseSelect
          noEmptyValue={noEmptyValue}
          data={data}
          value={value}
          onValue={onChange}
          />
      </VBox>
    );
  }
});

module.exports = Select;
