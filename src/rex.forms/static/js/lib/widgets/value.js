/**
 * @jsx React.DOM
 */
'use strict';

var React               = require('react');
var ReactForms          = require('react-forms');
var LabelRenderingMixin = require('./LabelRenderingMixin');
var _                   = require('../localization')._;


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
            <span className="rex-forms-value__novalue">
              {_('No value provided.')}
            </span> :
            val.value}
        </div>
      </div>
    );
  }
});

module.exports = value;
