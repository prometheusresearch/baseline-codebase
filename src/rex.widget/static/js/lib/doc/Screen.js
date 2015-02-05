/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../layout');
var theme         = require('./theme');
var StyleUtils    = require('./StyleUtils');
var Sidebar       = require('./Sidebar');
var Widget        = require('./Widget');
var Placeholder   = require('./Placeholder');

var Screen = React.createClass({

  style: {
    overflow: 'hidden',
    flexDirection: 'row-reverse'
  },

  styleSidebar: {
    boxShadow: StyleUtils.boxShadow(0, 0, 2, 0, theme.colors.shadow),
    overflow: 'hidden'
  },

  render() {
    var {widgets, selected, ...props} = this.props;
    var selectedWidget = null;
    for (var i = 0, len = widgets.length; i < len; i++) {
      if (widgets[i].name === selected) {
        selectedWidget = widgets[i];
        break;
      }
    }
    return (
      <HBox {...props} style={this.style} width="100%" height="100%">
        <VBox size={4}>
          {selectedWidget == null && <Placeholder />}
          {selectedWidget != null && <Widget widget={selectedWidget} />}
        </VBox>
        <Sidebar
          size={1}
          selectedWidget={selectedWidget}
          widgets={widgets}
          onSelect={this._onSelected}
          style={this.styleSidebar}
          />
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      size: 1
    };
  },

  _onSelected(widget) {
    this.props.onSelected(widget.name);
  }
});

module.exports = Screen;
