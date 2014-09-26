/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');
var EnumerationWidgetMixin = require('./EnumerationWidgetMixin');

var dropDown = React.createClass({
  mixins: [EnumerationWidgetMixin],

  className: 'rex-forms-dropDown',

  renderEnumeration: function (enumeration) {
    return (
      <option key={enumeration.id} value={enumeration.id}>
        {this.localize(enumeration.text)}
      </option>
    );
  },

  renderInput: function () {
    return (
      <select
        className="rex-forms-dropDown"
        id={this.getInputName()}
        name={this.getInputName()}
        onChange={this.onChange}
        disabled={this.props.disabled}
        value={this.getValue()}>

        <option></option>
        {this.getEnumerations().map(this.renderEnumeration)}
      </select>
    );
  }
});


module.exports = dropDown;
