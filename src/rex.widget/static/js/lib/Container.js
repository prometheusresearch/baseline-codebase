/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var PropTypes = React.PropTypes;

var Container = React.createClass({

  propTypes: {
    rows: PropTypes.renderable
  },

  render: function() {
    return this.transferPropsTo(
      <div className="rex-widget-Container container-fluid">
        {this.props.rows}
      </div>
    );
  }
});

module.exports = Container;
