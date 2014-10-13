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

  render: function() {
    var records = this.renderRecords();
    var error = this.renderError();
    var className = cx(
      'rex-forms-Widget',
      'rex-forms-recordList',
      'rex-forms-recordList-' + this.props.name,
      error ? 'rex-forms-Widget--error' : null,
      error ? 'rex-forms-recordList--error' : null
    );

    var options = this.getWidgetOptions();
    var addText = options.addLabel ? this.localize(options.addLabel) : _('Add');

    return (
      <div className={className}>
        {this.renderLabel()}
        {this.renderHelp()}
        {records}
        {error}
        <div>
          <button
            type="button"
            className="rex-forms-recordList__add"
            disabled={this.props.disabled}
            onClick={this.onAdd}>{addText}</button>
        </div>
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
    }
  },

  onNext: function(name) {
    var value = this.value().value;
    var next = utils.findAfter(value, (_, idx) => idx, name);
    if (next) {
      this.refs[next].focus();
    } else {
      this.props.onNext(this.props.name);
    }
  },

  onAdd: function () {
    this.add();
  }
});

module.exports = recordList;
