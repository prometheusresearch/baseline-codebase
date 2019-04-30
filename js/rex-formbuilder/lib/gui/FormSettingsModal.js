/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var PropTypes = require('prop-types');
var ReactCreateClass = require('create-react-class');
var {Form, schema} = require('react-forms-old');
var {Mapping} = schema;

var ModalMixin = require('./Modal');
var properties = require('../properties');
var {DraftSetActions} = require('../actions');
var {DraftSetStore} = require('../stores');
var _ = require('../i18n').gettext;


var FormSettingsModal = ReactCreateClass({
  mixins: [
    ModalMixin
  ],

  propTypes: {
    onComplete: PropTypes.func
  },

  getDefaultProps: function () {
    return {
      onComplete: function () {},
      className: 'rfb-form-settings-modal'
    };
  },

  getSchema: function () {
    /*eslint new-cap:0 */
    return Mapping({
      title: properties.LocalizedText.create({
        label: _('Title'),
        required: true
      }),
      locale: properties.FormLocalization.create({
        label: _('Default Language'),
        required: true
      }),
      parameters: properties.ParameterList.create({
        label: _('Externally-Provided Parameters'),
      })
    });
  },

  getValue: function () {
    var cfg = DraftSetStore.getActiveConfiguration();
    if (!cfg) { return {}; }
    return {
      title: cfg.title,
      locale: cfg.locale,
      parameters: cfg.parameters
    };
  },

  onSubmit: function (event) {
    event.preventDefault();

    var form = this.refs.form;
    if (form.getValidation().isFailure) {
      form.makeDirty();
    } else {
      DraftSetActions.setAttributes(form.getValue().toJS());
      if (this.props.onComplete) {
        this.props.onComplete();
      }
    }
  },

  onCancel: function (event) {
    event.preventDefault();

    var form = this.refs.form;
    form.setValue(this.getValue());
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  },

  renderModalContent: function () {
    return (
      <div>
        <h3>{_('Form Settings')}</h3>
        <Form
          component="div"
          schema={this.getSchema()}
          defaultValue={this.getValue()}
          ref="form"
          />
        <div className="rfb-modal-actions">
          <button
            className="rfb-button"
            onClick={this.onSubmit}>
            {_('Update')}
          </button>
          <button
            className="rfb-button"
            onClick={this.onCancel}>
            {_('Cancel')}
          </button>
        </div>
      </div>
    );
  }
});


module.exports = FormSettingsModal;

