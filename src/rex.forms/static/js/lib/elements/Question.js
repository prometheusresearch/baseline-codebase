/**
 * @jsx React.DOM
 */
'use strict';

var React                = require('react');
var ReactForms           = require('react-forms');
var cx                   = React.addons.classSet;
var widgetMap            = require('../widgets').defaultWidgetMap;
var utils                = require('../utils');
var ElementMixin         = require('./ElementMixin');
var WidgetConfiguration  = require('../form/WidgetConfiguration');

function determineWidgetType(
    widgetTypes, readOnlyWidgetTypes,
    instrumentRootType, elementOptions, readOnly) {
  var widgetType;
  var types = readOnly ? readOnlyWidgetTypes : widgetTypes;
  var possibleWidgets = types[instrumentRootType] || types.text;

  if (elementOptions.widget
      && possibleWidgets.indexOf(elementOptions.widget.type) >= 0) {
    widgetType = elementOptions.widget.type;
  } else {
    widgetType = possibleWidgets[0];
  }

  return widgetType;
}

var Question = React.createClass({
  mixins: [
    ElementMixin,
    ReactForms.FieldsetMixin,
    WidgetConfiguration.Mixin
  ],

  propTypes: {
    readOnly: React.PropTypes.bool
  },

  render: function () {
    var classes = this.getBaseClasses();
    classes['rex-forms-Question'] = true;
    classes['rex-forms-Question-' + this.props.name] = true;
    classes = cx(classes);

    var style = {
      display: this.props.hidden ? 'none' : 'block'
    };

    return this.transferPropsTo(
      <div className={classes} style={style}>
        {this.renderValue()}
        {this.renderExplanation()}
        {this.renderAnnotation()}
      </div>
    );
  },

  renderExplanation: function() {
    var options = {};
    var Widget = this.props.readOnly ?
      widgetMap.readOnlyExplanation :
      widgetMap.explanation;

    if (this.value().schema.children.explanation) {
      return Widget({
        name: 'explanation',
        disabled: this.props.disabled,
        key: `${this.props.name}[explanation]`,
        options: options
      });
    }

    return null;
  },

  renderAnnotation: function() {
    var options = {};
    var Widget = this.props.readOnly ? 
      widgetMap.readOnlyAnnotation :
      widgetMap.annotation;
    var value = this.value();
    var valueEntered = value.get('value').value !== null;

    if (!valueEntered && value.schema.children.annotation) {
      return Widget({
        name: 'annotation',
        required: value.schema.props.annotation === 'required',
        disabled: this.props.disabled,
        key: `${this.props.name}[annotation]`,
        options: options
      });
    }

    return null;
  },

  renderValue: function() {
    var instrumentRootType = this.value().schema
      .children.value.props.instrumentType.rootType;

    var Widget = this.getWidget(instrumentRootType, this.props.readOnly);

    var props = {
      name: 'value',
      ref: 'widget',
      onNext: this.onNext,
      disabled: this.props.disabled,
      key: `${this.props.name}[value]`,
      options: this.props.options
    };

    if (this.props.widgetProps) {
      utils.mergeInto(props, this.props.widgetProps);
    }

    return Widget(props);
  },

  getDefaultProps: function() {
    return {
      onNext: utils.emptyFunction
    };
  },

  getWidget: function(instrumentRootType, readOnly) {
    var widgetType = determineWidgetType(
      this.getWidgetTypes(), this.getReadOnlyWidgetTypes(),
      instrumentRootType || 'text',
      this.props.options,
      readOnly
    );
    return widgetMap[widgetType];
  },

  onNext: function() {
    this.props.onNext(this.props.name);
  },

  focus: function() {
    this.refs.widget.focus();
  }
});


module.exports = {
  Question: Question,
  determineWidgetType: determineWidgetType
};

