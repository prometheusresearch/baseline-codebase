/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var cx          = React.addons.classSet;
var WidgetMixin = require('./WidgetMixin');

var textArea = React.createClass({
  mixins: [WidgetMixin],

  className: 'rex-forms-textArea',

  renderInput: function () {
    var className = cx(
      'form-control',
      this.getSize('height'),
      this.getSize('width')
    );
    return (
      <textarea
        disabled={this.props.disabled}
        className={className}
        id={this.getInputName()}
        name={this.getInputName()}
        onChange={this.onChange}
        value={this.getValue()}
        />
    );
  }
});

module.exports = textArea;
