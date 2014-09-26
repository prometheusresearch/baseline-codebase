/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');
var _ = require('../localization')._;
var MultiLineText = require('./MultiLineText');


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
        <MultiLineText text={this.value().value} />
      </div>
    );
  }
});


module.exports = readOnlyAnnotation;

