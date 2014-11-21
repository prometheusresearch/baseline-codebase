/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var cx          = React.addons.classSet;
var WidgetMixin = require('./WidgetMixin');

var inputNumber = React.createClass({
  mixins: [WidgetMixin],

  renderInput: function() {
    var className = cx('rex-forms-inputNumber', this.getSize('width'));
    return (
      <input
        disabled={this.props.disabled}
        className={className}
        type={'text'}
        id={this.getInputName()}
        name={this.getInputName()}
        onChange={this.onChange}
        value={this.getValue()}
        />
    );
  }
});


module.exports = inputNumber;

