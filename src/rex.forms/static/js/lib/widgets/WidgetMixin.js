/**
 * @jsx React.DOM
 */

'use strict';

var React               = require('react');
var cx                  = React.addons.classSet;
var cloneWithProps      = React.addons.cloneWithProps;
var ReactForms          = require('react-forms');
var chain               = require('../utils').chain;
var localization        = require('../localization');
var LabelRenderingMixin = require('./LabelRenderingMixin');
var DirtyState          = require('./DirtyState');

var WidgetMixin = {
  mixins: [
    ReactForms.FieldMixin,
    localization.LocalizedMixin,
    LabelRenderingMixin,
    DirtyState
  ],

  propTypes: {
    name: React.PropTypes.string.isRequired,
    options: React.PropTypes.object,
    required: React.PropTypes.bool
  },

  render: function() {
    var required = this.props.required || this.value().schema.props.required;
    var label = this.renderLabel(this.getInputName());
    var help = this.renderHelp();
    var error = this.renderError();
    var input = this.renderInput();

    input = cloneWithProps(input, {
      onBlur: chain(input.props.onChange, this.markDirty),
      onChange: chain(input.props.onChange, this.markDirty)
    });

    var className = cx(
      'rex-forms-Widget',
      required ? 'rex-forms-Widget--required' : null,
      'rex-forms-Widget-' + this.props.name,
      error ? 'rex-forms-Widget--error' : null,
      'form-group'
    );

    return (
      <div className={className}>
        {label}
        <div className="rex-forms-Widget__input">
          {input}
        </div>
        {error}
        {help}
      </div>
    );
  },

  renderError: function() {
    if (!this.isDirty()) {
      return null;
    }
    var text = null;
    var validation = this.value().validation;

    if (ReactForms.validation.isFailure(validation)) {
      if (this.props.options.error) {
        text = this.localize(this.props.options.error);
      } else {
        text = validation.validation.failure;
      }
    }

    return text
      ? <div className="rex-forms-Widget__error">{text}</div>
      : null;
  },

  getDefaultProps: function() {
    return {
      options: {},
      required: false
    };
  },

  getValue: function() {
    return this.value().serialized;
  },

  getWidgetOptions: function() {
    if (this.props.options && this.props.options.widget) {
      return this.props.options.widget.options || {};
    }
    return {};
  },

  getName: function() {
    return this.context.value.schema.name || this.props.name;
  },

  getInputName: function() {
    if (this.context.value.schema.name) {
        return `${this.context.value.schema.name}[${this.props.name}]`;
    } else {
        return this.props.name;
    }
  },

  getSize: function(dimension, defaultSize, allowedSizes) {
    defaultSize = defaultSize || 'medium';
    allowedSizes = ['small', 'medium', 'large'];

    var widgetOptions = this.getWidgetOptions();
    var size = widgetOptions[dimension] || defaultSize;

    if (allowedSizes.indexOf(size) >= 0) {
      return `${dimension}-${size}`;
    }

    return `${dimension}-${defaultSize}`;
  }
};

module.exports = WidgetMixin;
