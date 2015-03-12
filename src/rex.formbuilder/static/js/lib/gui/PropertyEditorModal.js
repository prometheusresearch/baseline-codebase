/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var ModalMixin = require('./Modal');
var PropertyEditor = require('./PropertyEditor');
var _ = require('../i18n').gettext;


var PropertyEditorModal = React.createClass({
  mixins: [
    ModalMixin
  ],

  propTypes: {
    element: React.PropTypes.object.isRequired,
    onComplete: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      onComplete: function () {},
      className: 'rfb-property-editor-modal'
    };
  },

  onSubmit: function () {
    if (this.refs.editor.checkValid()) {
      var props = this.refs.editor.getProperties();
      var element = this.props.element.clone(true);
      Object.keys(props).forEach((prop) => {
        element[prop] = props[prop];
      });

      this.props.onComplete(element);
    }
  },

  onCancel: function () {
    this.props.onCancel();
  },

  reset: function () {
    this.refs.editor.reset();
  },

  renderModalContent: function () {
    return (
      <div>
        <PropertyEditor
          ref='editor'
          element={this.props.element}
          />

        <div className='rfb-modal-actions'>
          <button
            className='rfb-button'
            onClick={this.onSubmit}>
            {_('Update')}
          </button>
          <button
            className='rfb-button'
            onClick={this.onCancel}>
            {_('Cancel')}
          </button>
        </div>
      </div>
    );
  }
});


module.exports = PropertyEditorModal;

