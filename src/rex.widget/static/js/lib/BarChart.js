/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var d3    = require('d3');

var ChartMixin = {

  render: function() {
    return this.transferPropsTo(
      <div className="rex-widget-Chart">
        <svg ref="chart" />
      </div>
    );
  },

  componentDidUpdate: function() {
    this.chart(this.refs.chart.getDOMNode());
  },

  componentDidMount: function() {
    this.chart(this.refs.chart.getDOMNode());
  }
};

var BarChart = React.createClass({
  mixins: [ChartMixin],

  chart: function(node) {
  }
});

module.exports = BarChart;
