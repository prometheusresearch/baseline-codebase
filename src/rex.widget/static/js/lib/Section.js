/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Section = React.createClass({

  render: function() {
    return (
      <div className="rw-Section">
        {this.props.content}
      </div>
    );
  }
});

module.exports = Section;
