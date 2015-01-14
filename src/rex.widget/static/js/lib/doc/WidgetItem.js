/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React     = require('react');
var {VBox}    = require('../layout');
var merge     = require('../merge');
var Hoverable = require('./Hoverable');
var theme     = require('./theme');

var WidgetItem = React.createClass({
  mixins: [Hoverable],

  style: {
    cursor: 'pointer'
  },

  styleSelected: {
    background: theme.common.colors.selected
  },

  styleHover: {
    background: theme.common.colors.hover
  },

  render() {
    var {widget, selected, ...props} = this.props;
    var {hover} = this.state;
    return (
      <VBox {...props}
        style={merge(this.style, selected && this.styleSelected, hover && this.styleHover)}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
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
