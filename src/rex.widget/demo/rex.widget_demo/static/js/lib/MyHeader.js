/** @jsx React.DOM */

  var React = require('react');

  var MyHeader = React.createClass({

    onClick: function(){
      eval( this.props.code );
    },

    render: function() {
      var component = React.DOM['h' + this.props.level]
      if (this.props.data.data) {
        if ( this.props.code ) {
          return <component onClick={this.onClick}>{this.props.data.data}</component>
        } else {
          return <component>{this.props.data.data}</component>          
        }
      } else {
        return <component>{this.props.text}</component>
      }
    }

  });

  module.exports = MyHeader;
