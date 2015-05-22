/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var BaseSelect  = require('./BaseSelect');
var {VBox}      = require('./Layout');

var Select = React.createClass({
  
  render() {
    var {noEmptyValue, data, value, options, onChange,
      titleForEmpty, ...props} = this.props;
    return (
      <VBox {...props}>
        <BaseSelect
          options={options}
          noEmptyValue={noEmptyValue}
          titleForEmpty={titleForEmpty}
          data={data}
          value={value}
          onValue={onChange}
          />
      </VBox>
    );
  },

  componentDidMount() {
    this._checkForAutovalue();
  },

  componentDidUpdate() {
    this._checkForAutovalue();
  },

  _checkForAutovalue() {
    var {value, noEmptyValue, options, onChange} = this.props;
    if (value == null && noEmptyValue && options && options.length > 0) {
      onChange(options[0].id);
    }
  }
});

module.exports = Select;
