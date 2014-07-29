/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;
var chainFunction   = require('./chainFunction');
var merge           = require('./merge');

var Filter = React.createClass({

  propTypes: {
    id: React.PropTypes.string.isRequired,
    filter: React.PropTypes.renderable.isRequired,
    title: React.PropTypes.string.isRequired,
    value: React.PropTypes.string,
    onValue: React.PropTypes.func
  },

  render: function() {
    var filter = this.props.filter;
    filter = cloneWithProps(this.props.filter, {
      onValue: this.onValue.bind(null, filter.props.onValue)
    });
    return (
      <div className="rex-widget-Filter">
        <div className="rex-widget-Filter__title">{this.props.title}</div>
        <div className="rex-widget-Filter__filter">{filter}</div>
      </div>
    );
  },

  onValue: function(onValue, value) {
    this.props.onValue(this.props.id, value, onValue.produce(value));
  }
});

module.exports = Filter;
