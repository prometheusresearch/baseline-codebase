/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classSet = React.addons.classSet;


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

  handleOverlayClick: function (event) {
    if (this.props.canCancel
        && (event.target === this.refs.overlay.getDOMNode())) {
      event.preventDefault();
      this.props.onCancel();
    }
  },

  render: function () {
    var classes = classSet({
      'rfb-modal': true,
      'rfb-modal__active': this.props.visible
    });
    if (this.props.className) {
      classes = classSet(classes, this.props.className);
    }

    var content = this.renderModalContent();

    return (
      <div
        className={classes}
        ref='overlay'
        onClick={this.handleOverlayClick}>
        <div
          className='rfb-modal-content'>
          {content}
        </div>
      </div>
    );
  }
};


module.exports = ModalMixin;

