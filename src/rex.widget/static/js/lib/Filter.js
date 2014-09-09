/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var PropTypes       = React.PropTypes;
var cloneWithProps  = React.addons.cloneWithProps;
var cx              = React.addons.classSet;
var chainFunction   = require('./chainFunction');
var merge           = require('./merge');

var Filter = React.createClass({

  propTypes: {
    id: PropTypes.string.isRequired,
    filter: PropTypes.renderable.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.string,
    onValue: PropTypes.func,
    inline: PropTypes.bool,
    amortizationEnabled: PropTypes.bool
  },

  render() {
    var filter = this.props.filter;
    filter = cloneWithProps(this.props.filter, {
      inline: this.props.inline,
      title: filter.props.title || this.props.title,
      onValue: this.onValue.bind(null, filter.props.onValue),
      amortizationEnabled: this.props.amortizationEnabled
    });
    var className = cx(
      'rex-widget-Filter',
      this.props.inline && 'rex-widget-Filter--inline'
    );
    return (
      <div className={className}>
        <div className="rex-widget-Filter__title">{this.props.title}</div>
        <div className="rex-widget-Filter__filter">{filter}</div>
      </div>
    );
  },

  onValue(onValue, value) {
    this.props.onValue(this.props.id, value, onValue.produce(value));
  }
});

module.exports = Filter;
