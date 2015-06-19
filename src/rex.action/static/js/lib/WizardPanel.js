/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

var React                     = require('react/addons');
var RexWidget                 = require('rex-widget');
var {VBox, HBox}              = RexWidget.Layout;
var {boxShadow, border,
     rgba, rgb,
     position, cursor}        = RexWidget.StyleUtils;
var ActionButton              = require('./ActionButton');

var Style = {
  self: {
    minWidth: 300
  },
  shim: {
    cursor: cursor.pointer,
    position: position.absolute,
    zIndex: 10000,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },
  sidebar: {
    top: 50,
    width: 150
  },
  onThemed: {
    self: {
      background: rgb(255, 255, 255),
      boxShadow: boxShadow(0, 0, 6, 2, rgb(204, 204, 204))
    },
    shim: {
      background: rgba(0, 0, 0, 0.05)
    }
  }
};

var WizardPanel = React.createClass({

  render() {
    var {children, active, style, noTheme} = this.props;
    return (
      <HBox>
        {this.renderSidebar()}
        <VBox style={{...Style.self, ...(!noTheme && Style.onThemed.self), ...style}}>
          {children}
          {!active &&
            <VBox
              style={{...Style.shim, ...(!noTheme && Style.onThemed.shim)}}
              onClick={this.onFocus}
              />}
        </VBox>
      </HBox>
    );
  },

  renderSidebar() {
    var {siblingActions, actionId, actions} = this.props;
    return siblingActions.length > 1 && (
      <VBox style={Style.sidebar}>
        {siblingActions.map(id => {
          var action = actions[id];
          return (
            <ActionButton
              align="right"
              key={id}
              active={id === actionId}
              action={action}
              actionId={id}
              onClick={this.onReplace}
              />
          );
        })}
      </VBox>
    );
  },

  onFocus() {
    this.props.onFocus(this.props.actionId);
  },

  onReplace(id) {
    this.props.onReplace(this.props.actionId, id);
  }
});

module.exports = WizardPanel;
module.exports.Style = Style;
