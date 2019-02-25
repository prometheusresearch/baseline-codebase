/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {Form, schema} = require('react-forms-old');
var {Mapping, Scalar} = schema;

var ModalMixin = require('./Modal');
var _ = require('../i18n').gettext;


var CreateInstrumentModal = React.createClass({
  mixins: [
    ModalMixin
  ],

  propTypes: {
    onComplete: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      onComplete: function () {},
      className: 'rfb-create-instrument-modal'
    };
  },

  getSchema: function () {
    /*eslint new-cap:0 */
    return Mapping({
      code: Scalar({
        label: _('Unique Code'),
        required: true,
        validate: function (schema, value) {
          if (value && (value.length < 3)) {
            return new Error(_('Codes must be at least three characters long'));
          }
        }
      }),

      title: Scalar({
        label: _('Title'),
        required: true
      })
    });
  },

  onSubmit: function (event) {
    event.preventDefault();
    var form = this.refs.form;
    if (form.getValidation().isFailure) {
      form.makeDirty();
    } else {
      this.props.onComplete(form.getValue().toJS());
    }
  },

  reset: function () {
    this.refs.form.setValue({});
  },

  renderModalContent: function () {
    return (
      <div>
        <Form
          component="div"
          schema={this.getSchema()}
          ref="form"
          />
        <div className="rfb-modal-actions">
          <button
            className="rfb-button"
            onClick={this.onSubmit}>
            {_('Create')}
          </button>
          {this.props.onCancel &&
            <button
              className="rfb-button"
              onClick={this.props.onCancel}>
              {_('Cancel')}
            </button>
          }
        </div>
      </div>
    );
  }
});


module.exports = CreateInstrumentModal;

