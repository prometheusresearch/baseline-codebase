/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React      = require('react');
var merge      = require('../merge');
var {VBox}     = require('../layout');
var sortBy     = require('../sortBy');
var groupBy    = require('../groupBy');
var theme      = require('./theme');
var StyleUtils = require('./StyleUtils');
var WidgetItem = require('./WidgetItem');

var WidgetList = React.createClass({

  style: {
    overflow: 'auto'
  },

  render() {
    var {widgets, selectedWidget, onSelect, style, ...props} = this.props;
    widgets = sortBy(widgets, w => w.module);
    widgets = groupBy(widgets, w => w.module);
    return (
      <VBox {...props} style={merge(this.style, style)}>
        {widgets.map((widgets) =>
          <VBox key={widgets.key}>
            <WidgetListSeparator>
              {widgets.key}
            </WidgetListSeparator>
            {sortBy(widgets.group, w => w.name).map(widget =>
              <WidgetItem
                selected={selectedWidget && widget.name === selectedWidget.name}
                key={widget.name}
                onClick={onSelect}
                widget={widget}
                />)}
          </VBox>
        )}
      </VBox>
    );
  }
});

var WidgetListSeparator = React.createClass({

  style: {
    fontWeight: 'bold',
    fontSize: '80%',
    padding: '2px 4px',
    color: theme.colors.mutedText,
    background: theme.colors.muted
  },

  render() {
    return (
      <VBox style={this.style}>
        {this.props.children}
      </VBox>
    );
  }
});

module.exports = WidgetList;
