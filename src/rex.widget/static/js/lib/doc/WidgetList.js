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
    return (
      <VBox {...props} style={this.style}>
        {widgets.map(widget =>
          <WidgetItem
            selected={selectedWidget && widget.name === selectedWidget.name}
            key={widget.name}
            onClick={onSelect}
            widget={widget}
            />
        )}
      </VBox>
    );
  }
});

module.exports = WidgetList;
