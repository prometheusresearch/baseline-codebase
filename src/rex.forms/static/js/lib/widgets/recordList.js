/**
 * @jsx React.DOM
 */
'use strict';

var React                   = require('react');
var ReactForms              = require('react-forms');
var cx                      = React.addons.classSet;
var record                  = require('./record');
var LabelRenderingMixin     = require('./LabelRenderingMixin');
var SelfErrorRenderingMixin = require('./SelfErrorRenderingMixin');
var localization            = require('../localization');
var _ = localization._;
var utils                   = require('../utils');


var recordList = React.createClass({
  mixins: [
    ReactForms.RepeatingFieldsetMixin,
    LabelRenderingMixin,
    SelfErrorRenderingMixin,
    localization.LocalizedMixin
  ],

  getWidgetOptions: function() {
    if (this.props.options && this.props.options.widget) {
      return this.props.options.widget.options || {};
    }
    return {};
  },

  getInitialState: function () {
    return {
      dirty: false
    };
  },

  render: function() {
    var records = this.renderRecords();
    var error = this.state.dirty ? this.renderError() : null;
    var required = this.value().schema.props.nonEmpty;
    var className = cx(
      'rex-forms-Widget',
      required ? 'rex-forms-recordList--required' : null,
      'rex-forms-recordList',
      'rex-forms-recordList-' + this.props.name,
      error ? 'rex-forms-Widget--error' : null,
      error ? 'rex-forms-recordList--error' : null
    );

    var options = this.getWidgetOptions();
    var addText = options.addLabel ? this.localize(options.addLabel) : _('Add');

    return (
      <div className={className}>
        {this.renderLabel(null, 'rex-forms-recordList--header')}
        {this.renderHelp()}
        {records}
        <div>
          <button
            type="button"
            ref='addRecord'
            className="rex-forms-recordList__add"
            disabled={this.props.disabled}
            onKeyDown={this.onButtonKeyDown}
            onClick={this.onAdd}>{addText}</button>
        </div>
        {error}
      </div>
    );
  },

  renderRecords: function () {
    var value = this.value();

    var options = this.getWidgetOptions();
    var removeText = this.localize(options.removeLabel);

    return value.value.map((_, name) => {
      return (
        <record
          key={name}
          ref={name}
          name={name}
          onNext={this.onNext}
          onRemove={this.remove}
          removeLabelText={removeText}
          disabled={this.props.disabled}
          questions={this.props.options.questions}
          />
      );
    });
  },

  getDefaultProps: function() {
    return {onNext: utils.emptyFunction};
  },

  focus: function() {
    if (this.value().value.length > 0) {
      this.refs[0].focus();
    } else {
      this.refs.addRecord.getDOMNode().focus();
    }
  },

  onNext: function(name) {
    var value = this.value().value;
    var next = utils.findAfter(value, (_, idx) => idx, name);
    if (next) {
      this.refs[next].focus();
    } else {
      this.refs.addRecord.getDOMNode().focus();
    }
  },

  onButtonKeyDown: function (event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      this.props.onNext();
    }
  },

  onAdd: function () {
    this.add();
    this.setState({dirty: true});

    // Focus the new record
    setTimeout(() => {
      this.refs[this.value().value.length - 1].focus();
    }, 1);
  }
});

module.exports = recordList;
