/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react/addons');
var Field = require('./Field');
var Input = require('./Input');

var NumberInput = React.createClass({

  render() {
    return (
      <Input
        {...this.props}
        onChange={this.onChange}
        />
    );
  },

  onChange(e) {
    var value = e.target.value;
    value = parseFloat(value, 10);
    this.props.onChange(value);
  }

});

var NumberField = React.createClass({

  render() {
    return (
      <Field {...this.props}>
        <NumberInput />
      </Field>
    );
  }
});

module.exports = NumberField;

