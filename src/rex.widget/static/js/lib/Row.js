/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var PropTypes = React.PropTypes;

var Row = React.createClass({

  propTypes: {
    columns: PropTypes.renderable,
    height: PropTypes.number
  },

  render: function() {
    var style = {height: `${this.props.height}%`};
    return this.transferPropsTo(
      <div className="rex-widget-Row row" style={style}>
        {this.props.columns}
      </div>
    );
  },

  getDefaultProps: function() {
    return {
      height: 100
    };
  }
});

module.exports = Row;
