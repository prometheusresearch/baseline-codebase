/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react');
var ReactForms      = require('react-forms');
var utils           = require('../utils');
var cx              = React.addons.classSet;
var componentMap    = require('../elements').defaultElementComponentMap;
var FormEventsMixin = require('./FormEventsMixin');

var Page = React.createClass({

  mixins: [
    ReactForms.FieldsetMixin,
    FormEventsMixin
  ],

  propTypes: {
    page: React.PropTypes.object.isRequired
  },

  render: function() {
    var elements = this.props.page.elements
      .map(this.renderElement);
    var className = cx(
      'rex-forms-Page',
      'rex-forms-Page-' + this.props.page.id
    );
    return <div className={className}>{elements}</div>;
  },

  renderElement: function(element, idx) {
    var elementComponent = componentMap[element.type];
    var name = element.options ? element.options.fieldId : undefined;
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

    var disabled = events.isDisabled(this.props.page.id);
    var hidden = events.isHidden(this.props.page.id);

    disabled = tags.reduce((previousValue, currentValue) => {
      return previousValue || events.isDisabled(currentValue);
    }, disabled);
    hidden = tags.reduce((previousValue, currentValue) => {
      return previousValue || events.isHidden(currentValue);
    }, hidden);

    if (element.type === 'question') {
      utils.mergeInto(props, {
        name,
        ref: element.options.fieldId,
        onNext: this.onNext,
        disabled: disabled || events.isDisabled(name) || events.isCalculated(name),
        hidden: hidden || events.isHidden(name)
      });

    } else if (element.type === 'rawValueDisplay') {
      utils.mergeInto(props, {
        value: this.value()
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

  onNext: function(name) {
    var questions = this.props.page.elements.filter((el) => el.type === 'question');
    var next = utils.findAfter(questions, (q) => q.options.fieldId, name);
    if (next) {
      this.refs[next].focus();
    } else {
      this.props.onNext(this.props.page.id);
    }
  },

  getDefaultProps: function() {
    return {
      onNext: utils.emptyFunction
    };
  }

});


module.exports = Page;
