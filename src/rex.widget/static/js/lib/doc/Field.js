/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../layout');
var Hoverable     = require('../Hoverable');
var merge         = require('../merge');
var theme         = require('./theme');

var Field = React.createClass({
  mixins: [Hoverable],

  style: {
  },

  styleOnHover: {
    background: theme.colors.hover
  },

  styleName: {
    fontWeight: 'bold',
    marginRight: 5
  },

  styleType: {
    fontWeight: 'bold',
    position: 'absolute',
    right: 0,
    color: theme.colors.mutedText
  },

  styleMeta: {
    fontFamily: theme.fonts.monospace,
    fontSize: '80%'
  },

  styleOptional: {
    color: theme.colors.mutedText
  },

  render() {
    var {field, ...props} = this.props;
    var {hover} = this.state;
    return (
      <VBox {...this.hoverable} {...props} style={merge(this.style, hover && this.styleOnHover)}>
        <VBox margin="10px 10px">
          <HBox style={this.styleMeta}>
            <VBox style={this.styleName}>{field.name}</VBox>
            {!field.required ? <VBox style={this.styleOptional}> (optional)</VBox> : null}
            <VBox style={this.styleType}>{field.type}</VBox>
          </HBox>
          <VBox>{field.doc}</VBox>
        </VBox>
      </VBox>
    );
  }
});

module.exports = Field;
