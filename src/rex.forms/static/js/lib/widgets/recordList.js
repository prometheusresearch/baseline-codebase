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
          name={name}
          onRemove={this.remove}
          removeLabelText={removeText}
          questions={this.props.options.questions}
          />
      );
    });
  },

  onAdd: function () {
    this.add();
  }
});

module.exports = recordList;
