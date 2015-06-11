/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react/addons');
var Field = require('./Field');
var Input = require('./Input');

var NUMBER_RE = /^\-?[0-9]+(\.[0-9]*)?$/;

var NumberInput = React.createClass({

  render() {
    return (
      <Input
        {...this.props}
        value={this.state.value}
        onChange={this.onChange}
        />
    );
  },

  getInitialState() {
    return {
      value: this.props.value
    };
  },

  componentWillReceiveProps(nextProps) {
    var value = this._renderedComponent._pendingState ?
      this._renderedComponent._pendingState.value :
      this.state.value;
    if (nextProps.value === undefined) {
      this.setState({value: ''});
    } else if (nextProps.value !== parseFloat(value, 10)) {
      this.setState({value: String(nextProps.value)});
    }
  },

  onChange(e) {
    var prevValue = this.props.value;
    var value = e.target.value;
    this.setState({value});
    if (value === '') {
      this.props.onChange(undefined);
    } else {
      var parsed = parseFloat(value, 10);
      if (isNaN(parsed) || !NUMBER_RE.exec(value)) {
        this.props.onChange(value);
      } else {
        this.props.onChange(parsed);
      }
    }
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

