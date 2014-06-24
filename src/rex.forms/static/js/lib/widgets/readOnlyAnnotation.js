/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var ReactForms  = require('react-forms');
var _           = require('../localization')._;

var readOnlyAnnotation = React.createClass({
  mixins: [ReactForms.FieldMixin],

  render: function() {
    var value = this.value().value;
    if (value === null) {
      return <div />;
    }
    return this.transferPropsTo(
      <div className="rex-forms-readOnlyAnnotation">
        <label>
          {_("I can't (or won't) respond to this question because:")}
        </label>
        <div>{this.value().value}</div>
      </div>
    );
  }
});

module.exports = readOnlyAnnotation;
