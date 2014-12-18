/**
 * @jsx React.DOM
 */
'use strict';

var React      = require('react');
var ReactForms = require('react-forms');
var {Scalar}   = ReactForms.schema;
var merge      = require('./merge');

function validateIdentifier(v) {
  if (!/^[a-z](?:[a-z0-9]|[_-](?![_-]))*[a-z0-9]$/.test(v))
    return new Error('Wrong identifier: ' + v);
  return true;
}

function validateRFC3986(value) {
  // TODO: ...
  return true;
};

function validateVersion(value) {
  // TODO: ...
  return true;
};

var AsIsValueType = {
  serialize(value) {
    return value;
  },

  deserialize(value) {
    return value;
  }
};

var BoolType = {
  serialize(value) {
    return value;
  },

  deserialize(value) {
    return value;
  }
};

var OptionalList = {
  serialize(value) {
    return value;
  },

  deserialize(value) {
    return value;
  }
};

var ReadOnlyInput = React.createClass({
  render() {
    var value = this.props.value || '';
    return <span>{value}</span>;
  }
});

var ValueHolder = React.createClass({

  render() {
    return <div />;
  }
});

function ReadOnlyScalar(props) {
  props = merge(props, {
    component: <ReactForms.Field className="rfb-read-only" />,
    input: <ReadOnlyInput />
  });
  return Scalar(props);
}

function SimpleScalar(props) {
  props = merge(props, {
    component: <ReactForms.Field className="rfb-hidden" />,
    type: AsIsValueType, 
    input: <ValueHolder />
  });
  return Scalar(props);
}

function HiddenScalar(props) {
  props = merge(props, {required: true, input: <input type="hidden" />});
  return Scalar(props);
}

var FormHelpers = {
  ValueHolder,
  AsIsValueType,
  BoolType,
  validateIdentifier,
  validateRFC3986,
  validateVersion,
  ReadOnlyScalar,
  SimpleScalar,
  HiddenScalar,
  OptionalList
};

module.exports = FormHelpers;
