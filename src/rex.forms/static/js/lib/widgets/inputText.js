/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var cx          = React.addons.classSet;
var WidgetMixin = require('./WidgetMixin');

var inputText = React.createClass({
  mixins: [WidgetMixin],

  className: 'rex-forms-inputText',

  propTypes: {
    inputType: React.PropTypes.string
  },

  renderInput: function() {
    var className = cx('form-control', this.getSize('width'));
    return (
      <input
        disabled={this.props.disabled}
        className={className}
        type={this.props.inputType}
        id={this.getInputName()}
        name={this.getInputName()}
        onChange={this.onChange}
        value={this.getValue()}
        />
    );
  }
});

module.exports = inputText;
