/**
 * @jsx React.DOM
 */
'use strict';

var React                   = require('react');
var cx                      = React.addons.classSet;
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
        elements.push(this.renderElement(page.elements[j], page, `${i}_${j}`));
      }
    }

    var classes = cx({
      'rex-forms-FormOverview': true,
      'rex-forms-FormOverview__readonly': this.props.readOnly
    });
    var subtitle = this.props.subtitle;

    return (
      <div className={classes}>
        <Title text={title} subtitle={subtitle} />
        {!this.props.readOnly && <div
          className="rex-forms-FormOverview__note"
          dangerouslySetInnerHTML={{__html: NOTE}} />}
        {elements}
      </div>
    );
  },

  renderElement: function(element, page, idx) {
    var elementComponent = element.type === 'question' ?
      EditableQuestionWrapper :
      componentMap[element.type];
    var events = this.formEvents();

    utils.invariant(
      elementComponent !== undefined,
      "Unknown element type '" + element.type + "'"
    );

    var props = {
      options: element.options,
      key: idx
    };

    var tags = element.tags || [];

    var disabled = events.isDisabled(page.id);
    var hidden = events.isHidden(page.id);

    disabled = tags.reduce((previousValue, currentValue) => {
      return previousValue || events.isDisabled(currentValue);
    }, disabled);
    hidden = tags.reduce((previousValue, currentValue) => {
      return previousValue || events.isHidden(currentValue);
    }, hidden);

    if (element.type === 'question') {
      var name = element.options.fieldId;

      disabled = (
        disabled
        || this.props.readOnly
        || events.isDisabled(name)
      );

      hidden = hidden || events.isHidden(name);

      utils.mergeInto(props, {
        name,
        disabled,
        hidden,
        active: this.state.active === name && !this.props.readOnly,
        onEdit: this.onEdit,
        onSave: this.onSave,
        onCancel: this.onCancel,
        isValid: this.props.isFieldValid(name)
      });

    } else if (hidden) {
      // Show nothing.
      return (
        <div
          key={idx}
          />
      );

    } else {
      utils.mergeInto(props, {
        disabled,
        hidden
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
