/** @jsx React.DOM */

  var React = require('react');

  var MyHeader = React.createClass({

    onClick: function(){
      eval(this.props.code);
    },

    render: function() {
      var {level, data, text, code, ...props} = this.props;
      var Component = 'h' + level;
      if (data.data) {
        return code ?
          <Component {...props} onClick={this.onClick}>{data.data}</Component> :
          <Component {...props}>{data.data}</Component>          
      } else {
        return <Component {...props}>{text}</Component>
      }
    }

  });

  module.exports = MyHeader;
