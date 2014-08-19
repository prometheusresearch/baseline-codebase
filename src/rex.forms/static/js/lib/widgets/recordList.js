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
var _                       = require('../localization')._;


var recordList = React.createClass({
  mixins: [
    ReactForms.RepeatingFieldsetMixin,
    LabelRenderingMixin,
    SelfErrorRenderingMixin
  ],

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
            onClick={this.onAdd}>{_('Add')}</button>
        </div>
      </div>
    );
  },

  renderRecords: function () {
    var value = this.value();
    return value.value.map((_, name) => {
      return (
        <record
          key={name}
          name={name}
          onRemove={this.remove}
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
