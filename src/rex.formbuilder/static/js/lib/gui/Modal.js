/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');


var ModalMixin = {
  propTypes: {
    visible: React.PropTypes.bool,
    onCancel: React.PropTypes.func,
    className: React.PropTypes.string,
    canCancel: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      visible: false,
      canCancel: true,
      onCancel: function () {}
    };
  },

  componentWillMount: function () {
    this._configureDocument(this.props.visible);
  },

  componentWillReceiveProps: function (nextProps) {
    this._configureDocument(nextProps.visible);
  },

  componentWillUnmount: function () {
    this._configureDocument(false);
  },

  _configureDocument: function (modalVisible) {
    if (modalVisible) {
      document.body.classList.add('rfb-modal__active');
    } else {
      document.body.classList.remove('rfb-modal__active');
    }
  },

  render: function () {
    var classes = classNames({
      'rfb-modal': true,
      'rfb-modal__active': this.props.visible
    });
    if (this.props.className) {
      classes = classNames(classes, this.props.className);
    }

    var content = this.renderModalContent();

    return (
      <div
        className={classes}>
        <div
          className='rfb-modal-content'>
          {content}
        </div>
      </div>
    );
  }
};


module.exports = ModalMixin;

