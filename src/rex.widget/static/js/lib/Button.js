/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react/addons');

var Button = React.createClass({
  
  propTypes: {
    name: React.PropTypes.string,
    onClick: React.PropTypes.func.isRequired
  },

  render: function() {
    var name = this.props.name ? 'Save' : this.props.name;
    return (
      <button
        className="rex-widget-Button"
        placeholder={this.props.placeholder}
        onClick={this.onClick}
        id={this.props.id}>
        {name}
      </button>
    );
  },

  onClick: function(e) {
    var id = e.target.id;
    this.props.onClick(id);
  }

});

module.exports = Button;
