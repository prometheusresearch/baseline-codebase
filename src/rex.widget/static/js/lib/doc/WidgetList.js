/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React      = require('react');
var {VBox}     = require('../layout');
var WidgetItem = require('./WidgetItem');

var WidgetList = React.createClass({

  style: {
    overflow: 'auto'
  },

  render() {
    var {widgets, selectedWidget, onSelect, ...props} = this.props;
    widgets = sortBy(widgets, (w) => w.module);
    widgets = groupBy(widgets, (w) => w.module);
    return (
      <VBox {...props} style={this.style}>
        {widgets.map((widgets) =>
          <VBox key={widgets.key}>
            <WidgetListSeparator>
              {widgets.key}
            </WidgetListSeparator>
            {widgets.group.map(widget =>
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
    color: 'white',
    background: '#888',
    padding: '2px 4px'
  },

  render() {
    return <VBox style={this.style}>{this.props.children}</VBox>
  }
});

function sortBy(items, keyFunc) {
  items = items.slice(0);
  items.sort(function(a, b) {
    var aKey = keyFunc(a);
    var bKey = keyFunc(b);
    if (aKey > bKey) {
      return 1;
    }
    if (aKey < bKey) {
      return -1;
    }
    return 0;
  });
  return items;
}

function groupBy(items, keyFunc) {
  var result = [];
  var key;
  var group;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var itemKey = keyFunc(item);
    if (itemKey !== key) {
      key = itemKey;
      group = [];
      result.push({key, group});
    }
    group.push(item);
  }
  return result;
}

module.exports = WidgetList;
