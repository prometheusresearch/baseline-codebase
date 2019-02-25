/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var ModalMixin = require('./Modal');
var _ = require('../i18n').gettext;


var ConfirmationModalInner = React.createClass({
  mixins: [
    ModalMixin
  ],

  propTypes: {
    onAccept: React.PropTypes.func.isRequired,
    onReject: React.PropTypes.func.isRequired
  },

  renderModalContent: function () {
    return (
      <div className="rfb-confirmation-modal">
        <div className="rfb-confirmation-message">
          {this.props.children}
        </div>
        <div className="rfb-modal-actions">
          <button
            className="rfb-button"
            onClick={this.props.onAccept}>
            {_('Yes')}
          </button>
          <button
            className="rfb-button"
            onClick={this.props.onReject}>
            {_('No')}
          </button>
        </div>
      </div>
    );
  }
});


var ConfirmationModal = React.createClass({
  render: function () {
    return (
      <ConfirmationModalInner
        canCancel={false}
        {...this.props}
        />
    );
  }
});


module.exports = ConfirmationModal;

