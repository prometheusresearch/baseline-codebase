/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var PropTypes = React.PropTypes;

var Tab = React.createClass({

  propTypes: {
    title: PropTypes.string.isRequired,
    content: PropTypes.renderable
  },

  render: function() {
    return this.transferPropsTo(
      <div className="rex-widget-Tab">
        {this.props.content}
      </div>
    );
  }
});

module.exports = Tab;
