/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var ModalMixin = require('./Modal');


var TotalFailureModalInner = React.createClass({
  mixins: [
    ModalMixin
  ],

  renderModalContent: function () {
    return (
      <div className="rfb-total-failure-modal">
        <div className="rfb-total-failure-message">
          {this.props.children}
        </div>
      </div>
    );
  }
});


var TotalFailureModal = React.createClass({
  render: function () {
    return (
      <TotalFailureModalInner
        canCancel={false}
        {...this.props}
        />
    );
  }
});


module.exports = TotalFailureModal;

