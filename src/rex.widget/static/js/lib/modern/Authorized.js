/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react');
var Promise = require('./Promise');
var request = require('../request');

var Authorized = React.createClass({

  render() {
    if (!this.state.access) {
      return null;
    } else {
      return React.Children.only(this.props.children);
    }
  },

  getInitialState() {
    return this._stateFromProps(this.props);
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.access !== nextProps.access) {
      this.setState(this._stateFromProps(nextProps));
    }
  },

  componentDidMount() {
    this._checkAccess();
  },

  componentDidUpdate() {
    this._checkAccess();
  },

  _checkAccess() {
    if (this.state.access === null) {
      checkAccessTo(this.props.access).then(() => {
        this.setState(this._stateFromProps(this.props));
      });
    }
  },

  _stateFromProps(props) {
    return {access: hasAccessTo(props.access)};
  }

});

var PERMISSIONS_API_ENDPOINT = `${location.protocol}//${location.host}/widget/authorized`;

// Map<String, Boolean | Promise<Boolean>>
var _access = {};

function hasAccessTo(access) {
  var result = checkAccessTo(access);
  if (result.isFulfilled()) {
    return result.value();
  } else if (result.isRejected()) {
    throw result.reason();
  } else {
    return null;
  }
}

function checkAccessTo(access) {
  var result = _access[access];
  if (result === undefined) {
    result = _access[access] = request('GET', PERMISSIONS_API_ENDPOINT)
      .query({access})
      .promise()
      .then(response => response.body.authorized);
  }
  return result;
}

module.exports = Authorized;
