/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var Toaster = require('./Toaster');
var {ErrorStore, SuccessStore} = require('../stores');


var ToasterMixin = {
  TOAST_TYPE_ERROR: Toaster.TYPE_ERROR,
  TOAST_TYPE_INFO: Toaster.TYPE_INFO,
  TOAST_TYPE_SUCCESS: Toaster.TYPE_SUCCESS,

  propTypes: {
    toastTimeout: React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      toastTimeout: 7000
    };
  },

  getInitialState: function () {
    return {
      toasts: []
    };
  },

  componentDidMount: function () {
    global.TOAST = this.showToast;
    ErrorStore.addReportListener(this._onErrorReport);
    SuccessStore.addReportListener(this._onSuccessReport);
  },

  componentWillUnmount: function () {
    SuccessStore.removeReportListener(this._onSuccessReport);
    ErrorStore.removeReportListener(this._onErrorReport);
  },

  _onErrorReport: function (error) {
    var toast = {
      type: Toaster.TYPE_ERROR,
      message: error.error,
      additional: error.additional
    };
    this.showToast(toast);
  },

  _onSuccessReport: function (success) {
    var toast = {
      type: Toaster.TYPE_SUCCESS,
      message: success.message,
      additional: success.additional
    };
    this.showToast(toast);
  },

  showToast: function (toast) {
    var toasts = this.state.toasts.slice();
    toast.onDismiss = (event) => {
      event.stopPropagation();
      this.removeToast(toast);
    };
    toasts.push(toast);

    this.setState({
      toasts
    }, () => {
      if (this.props.toastTimeout > 0) {
        setTimeout(() => {
          this.removeToast(toast);
        }, this.props.toastTimeout);
      }
    });
  },

  removeToast: function (toast) {
    var toasts = this.state.toasts.slice(),
        toastIndex = toasts.indexOf(toast);

    if (toastIndex > -1) {
      toasts.splice(toastIndex, 1);
      this.setState({toasts});
    }
  },

  renderToaster: function () {
    return (
      <Toaster
        toasts={this.state.toasts}
        />
    );
  }
};


module.exports = ToasterMixin;

