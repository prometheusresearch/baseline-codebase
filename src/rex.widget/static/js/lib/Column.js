/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var PropTypes = React.PropTypes;

var Column = React.createClass({

  propTypes: {
    children: PropTypes.renderable,
    width: PropTypes.number
  },

  render: function() {
    return this.transferPropsTo(
      <div className={`rex-widget-Column col-md-${this.props.width || 3}`}>
        {this.props.children}
      </div>
    );
  }
});

module.exports = Column;
