/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React     = require('react');
var {VBox}    = require('../layout');
var merge     = require('../merge');
var Hoverable = require('../Hoverable');
var theme     = require('./theme');

var WidgetItem = React.createClass({
  mixins: [Hoverable],

  style: {
    cursor: 'pointer'
  },

  styleSelected: {
    background: theme.colors.selected
  },

  styleHover: {
    background: theme.colors.hover
  },

  render() {
    var {widget, selected, ...props} = this.props;
    var {hover} = this.state;
    return (
      <VBox {...props} {...this.hoverable}
        style={merge(this.style, selected && this.styleSelected, hover && this.styleHover)}
        onClick={this.onClick}>
        <VBox margin={5}>
          {widget.name}
        </VBox>
      </VBox>
    );
  },

  onClick() {
    var {widget, onClick} = this.props;
    onClick(widget);
  }
});

module.exports = WidgetItem;
