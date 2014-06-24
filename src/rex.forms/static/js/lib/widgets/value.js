/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var ReactForms = require('react-forms');
var LabelRenderingMixin = require('./LabelRenderingMixin');

var value = React.createClass({
  mixins: [
    ReactForms.FieldMixin,
    LabelRenderingMixin
  ],

  render: function() {
    var val = this.value();
    return (
      <div className="rex-forms-value">
        {this.renderLabel()}
        <div>
          {val.value === null ?
            <span className="rex-forms-value__novalue">no value</span> :
            val.value}
        </div>
      </div>
    );
  }
});

module.exports = value;
