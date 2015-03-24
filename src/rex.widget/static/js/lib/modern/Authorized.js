/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Promise = require('bluebird');
var React = require('react');
var request = require('../request');

var Authorized = React.createClass({

  render() {
    var {permission, children} = this.props;
    var hasPersmission = checkPermission(permission);
    if (hasPersmission && hasPersmission.then) {
      hasPersmission.then(this._onPermissionsChecked);
      return null;
    }
    if (!hasPersmission) {
      return null;
    }
    return React.Children.only(children);
  },

  _onPermissionsChecked() {
    this.forceUpdate();
  }
});

var PERMISSIONS_API_ENDPOINT = `${location.protocol}//${location.host}/widget/permissions`;

var _permissionsPromise;

function checkPermission(permission) {
  if (!_permissionsPromise) {
    _permissionsPromise = request('GET', PERMISSIONS_API_ENDPOINT)
      .promise()
      .then(response => response.body);
  }
  if (_permissionsPromise.isFulfilled()) {
    return !!_permissionsPromise.value()[permission];
  }
  if (_permissionsPromise.isRejected()) {
    throw _permissionsPromise.reason();
  }
  return _permissionsPromise.then(permissions => !!permissions[permission]);
}

module.exports = Authorized;
