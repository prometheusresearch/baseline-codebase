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

  styleOwnerWidget: {
    marginLeft: 5
  },

  styleDoc: {
    marginTop: 5,
    fontSize: '90%'
  },

  styleDefaultValue: {
    color: theme.colors.text
  },

  render() {
    var {field, widget, ...props} = this.props;
    var {hover} = this.state;
    return (
      <VBox {...this.hoverable} {...props} style={merge(this.style, hover && this.styleOnHover)}>
        <VBox margin="10px 10px">
          <HBox style={this.styleMeta}>
            <VBox style={this.styleName}>{field.name}</VBox>
            {!field.required ?
              <VBox style={this.styleOptional}>
                <span>
                  {' '}
                  (optional{field.default !== undefined ?
                    <span>, default value is <span style={this.styleDefaultValue}>{field.default}</span></span> :
                    null})
                </span>
              </VBox> :
              null}
            {field.owner_widget !== widget.name && field.owner_widget !== 'None' ?
              <HBox style={this.styleOwnerWidget}>
                <span>{' '}via {'<'}{field.owner_widget}{'>'} widget</span>
              </HBox> :
              null}
            <VBox style={this.styleType}>{field.type}</VBox>
          </HBox>
          <VBox
            style={this.styleDoc}
            dangerouslySetInnerHTML={{__html: field.doc}}
            />
        </VBox>
      </VBox>
    );
  }
});

module.exports = Field;
