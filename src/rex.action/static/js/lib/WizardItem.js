/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

var React                     = require('react/addons');
var RexWidget                 = require('rex-widget');
var {VBox, HBox}              = RexWidget.Layout;
var {boxShadow, border}       = RexWidget.StyleUtils;
var ActionButton              = require('./ActionButton');

var Style = {
  self: {
    minWidth: 300
  },
  shim: {
    cursor: 'pointer',
    position: 'absolute',
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
      background: '#ffffff',
      boxShadow: boxShadow(0, 0, 6, 2, '#cccccc')
    },
    shim: {
      background: 'rgba(0, 0, 0, 0.05)'
    }
  }
};

var WizardItem = React.createClass({

  render() {
    var {children, active, style, actions, siblingActions, actionId, noTheme} = this.props;
    return (
      <HBox>
        {siblingActions.length > 1 &&
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
          </VBox>}
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

  onFocus() {
    this.props.onFocus(this.props.actionId);
  },

  onReplace(id) {
    this.props.onReplace(this.props.actionId, id);
  }
});

module.exports = WizardItem;
module.exports.Style = Style;
