/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');


var Toaster = React.createClass({
  statics: {
    TYPE_ERROR: 'error',
    TYPE_INFO: 'info',
    TYPE_SUCCESS: 'success'
  },

  propTypes: {
    toasts: React.PropTypes.arrayOf(React.PropTypes.object)
  },

  getDefaultProps: function () {
    return {
      toasts: []
    };
  },

  buildToasts: function () {
    return this.props.toasts.map((toast, idx) => {
      var classes = classNames({
        'rfb-toast': true,
        'rfb-toast__error': toast.type === Toaster.TYPE_ERROR,
        'rfb-toast__info': toast.type === Toaster.TYPE_INFO,
        'rfb-toast__success': toast.type === Toaster.TYPE_SUCCESS
      });

      return (
        <div
          key={idx}
          onClick={toast.onClick}
          className={classes}>
          <div className='rfb-toast-message'>
            {toast.message}
            {toast.additional &&
              <div className='rfb-toast-additional'>
                {toast.additional}
              </div>}
            </div>
          <div
            onClick={toast.onDismiss}
            className='rfb-toast-control'>
            &times;
          </div>
        </div>
      );
    });
  },

  render: function () {
    return (
      <div className='rfb-toaster'>
        {this.buildToasts()}
      </div>
    );
  }
});


module.exports = Toaster;

