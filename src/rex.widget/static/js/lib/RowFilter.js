/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;
var chainFunction   = require('./chainFunction');
var merge           = require('./merge');

var RowFilter = React.createClass({

  propTypes: {
    id: React.PropTypes.string.isRequired,
    filter: React.PropTypes.renderable.isRequired,
    title: React.PropTypes.string,
    value: React.PropTypes.string,
    onValue: React.PropTypes.func
  },

  render: function() {
    var filter = this.props.filter;
    filter = cloneWithProps(this.props.filter, {
      onValue: this.onValue.bind(null, filter.props.onValue)
    });
    return (
      <span className="rex-widget-RowFilter">
        <span className="rex-widget-RowFilter__title">{this.props.title}</span>
        <span className="rex-widget-RowFilter__filter">{filter}</span>
      </span>
    );
  },

  onValue: function(onValue, value) {
    this.props.onValue(this.props.id, value, onValue.produce(value));
  }
});

module.exports = RowFilter;
