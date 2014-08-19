/**
 * @jsx React.DOM
 */
'use strict';

var React                   = require('react');
var ReactForms              = require('react-forms');
var utils                   = require('../utils');
var componentMap            = require('../elements').defaultElementComponentMap;
var _                       = require('../localization')._;
var FormEventsMixin         = require('./FormEventsMixin');
var Title                   = require('./Title');
var EditableQuestionWrapper = require('./EditableQuestionWrapper');

var NOTE = _(
  'Please review your entered values before completing the form.'
  + ' You can press the <strong>Edit</strong> button at the top-right corner'
  + ' of the question to edit its value.'
);

/**
 * Form which renders all fields read-only with "edit" button to selectively
 * edit some fields.
 */
var FormOverview = React.createClass({

  mixins: [
    ReactForms.FieldsetMixin,
    FormEventsMixin
  ],

  render: function() {
    var title = this.props.form.title ?
      this.props.form.title :
      this.props.instrument.title;

    var elements = [];

    for (var i = 0, lenP = this.props.form.pages.length; i < lenP; i++) {
      var page = this.props.form.pages[i];
      for (var j = 0, lenE = page.elements.length; j < lenE; j++) {
        elements.push(this.renderElement(page.elements[j], `${i}_${j}`));
      }
    }

    return (
      <div className="rex-forms-FormOverview">
        <Title text={title} />
        {!this.props.readOnly && <div
          className="rex-forms-FormOverview__note"
          dangerouslySetInnerHTML={{__html: NOTE}} />}
        {elements}
      </div>
    );
  },

  renderElement: function(element, idx) {
    var elementComponent = element.type === 'question' ?
      EditableQuestionWrapper :
      componentMap[element.type];

    utils.invariant(
      elementComponent !== undefined,
      "Unknown element type '" + element.type + "'"
    );

    var props = {
      options: element.options,
      key: idx
    };

    if (element.type === 'question') {
      var events = this.formEvents();
      var name = element.options.fieldId;

      var disabled = (
        this.props.readOnly
        || events.isDisabled(name)
        || events.isCalculated(name)
      );

      utils.mergeInto(props, {
        name, disabled,
        hidden: events.isHidden(name),
        active: this.state.active === name && !this.props.readOnly,
        onEdit: this.onEdit,
        onSave: this.onSave,
        onCancel: this.onCancel,
        isValid: this.props.isFieldValid(name)
      });
    }

    return elementComponent(props);
  },

  getInitialState: function() {
    return {active: null};
  },

  onEdit: function(active) {
    this.setState({active});
    this.props.startEditTransaction();
  },

  onSave: function() {
    this.setState({active: null});
    this.props.commitEditTransaction();
  },

  onCancel: function() {
    this.setState({active: null});
    this.props.rollbackEditTransaction();
  }
});

module.exports = FormOverview;
