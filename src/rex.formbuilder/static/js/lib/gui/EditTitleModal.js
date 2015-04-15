/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {Form, schema} = require('react-forms');
var {Mapping, Scalar} = schema;

var ModalMixin = require('./Modal');
var _ = require('../i18n').gettext;


var EditTitleModal = React.createClass({
  mixins: [
    ModalMixin
  ],

  propTypes: {
    title: React.PropTypes.string,
    onComplete: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      onComplete: function () {},
      className: 'rfb-edit-title-modal'
    };
  },

  getSchema: function () {
    /*eslint new-cap:0 */
    return Mapping({
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
      this.props.onComplete(form.getValue().get('title'));
    }
  },

  reset: function () {
    this.refs.form.setValue({title: this.props.title});
  },

  renderModalContent: function () {
    return (
      <div>
        {(this.props.title !== null) &&
          <Form
            component='div'
            schema={this.getSchema()}
            defaultValue={{title: this.props.title}}
            ref='form'
            />
        }
        <div className='rfb-modal-actions'>
          <button
            className='rfb-button'
            onClick={this.onSubmit}>
            {_('Update')}
          </button>
          {this.props.onCancel &&
            <button
              className='rfb-button'
              onClick={this.props.onCancel}>
              {_('Cancel')}
            </button>
          }
        </div>
      </div>
    );
  }
});


module.exports = EditTitleModal;

