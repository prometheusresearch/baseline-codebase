/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Section = React.createClass({

  render: function() {
    return (
      <div className="rex-widget-Section">
        {this.props.content}
      </div>
    );
  }
});

module.exports = Section;
