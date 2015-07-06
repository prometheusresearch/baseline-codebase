/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react');
var Field = require('./Field');
var Input = require('./Input');

var IntegerInput = React.createClass({

  render() {
    return (
      <Input
        {...this.props}
        type="number"
        onChange={this.onChange}
        />
    );
  },

  onChange(e) {
    var value = e.target.value;
    value = parseInt(value, 10);
    this.props.onChange(value);
  }

});

var IntegerField = React.createClass({

  render() {
    return (
      <Field {...this.props}>
        <IntegerInput />
      </Field>
    );
  }
});

module.exports = IntegerField;
