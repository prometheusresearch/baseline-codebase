/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React   = require('react');
var {VBox}  = require('../layout');

var Field = React.createClass({

  style: {
    background: '#eee'
  },

  styleName: {
    fontWeight: 'bold'
  },

  render() {
    var {field, ...props} = this.props;
    return (
      <VBox {...props} style={this.style} margin="10px 0px">
        <VBox margin={10}>
          <VBox style={this.styleName}>{field.name}</VBox>
          <VBox>{field.doc}</VBox>
        </VBox>
      </VBox>
    );
  }
});

module.exports = Field;
