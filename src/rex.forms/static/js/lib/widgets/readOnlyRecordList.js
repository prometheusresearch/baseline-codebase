/**
 * @jsx React.DOM
 */
'use strict';

var React               = require('react');
var ReactForms          = require('react-forms');
var cx                  = React.addons.classSet;
var record              = require('./record');
var LabelRenderingMixin = require('./LabelRenderingMixin');

var readOnlyRecordList = React.createClass({

  mixins: [
    ReactForms.RepeatingFieldsetMixin,
    LabelRenderingMixin
  ],

  render: function() {
    var className = cx(
      'rex-forms-Widget',
      'rex-forms-recordList',
      'rex-forms-recordList-' + this.props.name,
      'rex-forms-readOnlyRecordList',
      'rex-forms-readOnlyRecordList-' + this.props.name
    );
    return (
      <div className={className}>
        {this.renderLabel()}
        {this.renderRecords()}
      </div>
    );
  },

  renderRecords: function () {
    var value = this.value();
    return value.value.map((_, name) => {
      return (
        <record
          readOnly={true}
          key={name}
          name={name}
          onRemove={this.remove}
          questions={this.props.options.questions}
          />
      );
    });
  }
});

module.exports = readOnlyRecordList;
