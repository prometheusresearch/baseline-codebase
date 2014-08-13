/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var cx          = React.addons.classSet;
var WidgetMixin = require('./WidgetMixin');

var inputDateTime = React.createClass({
  mixins: [WidgetMixin],

  className: 'rex-forms-inputDateTime',

  propTypes: {
    inputType: React.PropTypes.string
  },

  renderInput: function() {
    var className = cx('form-control', this.getSize('width', 'small'));
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

