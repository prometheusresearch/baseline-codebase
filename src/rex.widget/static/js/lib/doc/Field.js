/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../layout');
var theme         = require('./theme');

var Field = React.createClass({

  style: {
    background: '#eee'
  },

  styleName: {
    fontWeight: 'bold'
  },

  styleType: {
    fontWeight: 'bold',
    background: '#CCCCCC',
    padding: '2px 4px',
    fontFamily: theme.fonts.monospace,
    fontSize: '80%'
  },

  styleMeta: {
    justifyContent: 'space-between'
  },

  render() {
    var {field, ...props} = this.props;
    return (
      <VBox {...props} style={this.style} margin="10px 0px">
        <VBox margin={10}>
          <HBox style={this.styleMeta}>
            <VBox style={this.styleName}>{field.name}</VBox>
            <VBox style={this.styleType}>{field.type}</VBox>
          </HBox>
          <VBox>{field.doc}</VBox>
        </VBox>
      </VBox>
    );
  }
});

module.exports = Field;
