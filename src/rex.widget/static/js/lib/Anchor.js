/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var Anchor = React.createClass({

  render: function() {
    var {fragmentId, ...props} = this.props;
    return (
      <a name={fragmentId}>
      </a>
    );
  }
});

module.exports = Anchor;
