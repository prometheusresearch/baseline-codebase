/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var cx          = React.addons.classSet;
var WidgetMixin = require('./WidgetMixin');

var inputDateTime = React.createClass({
  mixins: [WidgetMixin],

  propTypes: {
    inputType: React.PropTypes.string
  },

  renderInput: function() {
    var className = cx('rex-forms-inputDateTime', this.getSize('width', 'small'));
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

module.exports = inputDateTime;

