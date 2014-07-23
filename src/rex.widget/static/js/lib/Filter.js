/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;
var chainFunction   = require('./chainFunction');

var Filter = React.createClass({

  propTypes: {
    title: React.PropTypes.string,
    filter: React.PropTypes.renderable
  },

  render: function() {
    var filter = this.props.filter;
    filter = cloneWithProps(this.props.filter, {
      value: this.props.value,
      onValue: chainFunction(this.props.onValue, filter.props.onValue),
    });
    return (
      <div className="rex-widget-Filter">
        <div className="rex-widget-Filter__title">{this.props.title}</div>
        <div className="rex-widget-Filter__filter">{filter}</div>
      </div>
    );
  }
});

module.exports = Filter;
