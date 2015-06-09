/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

var React                     = require('react/addons');
var {cloneWithProps}          = React.addons;
var RexWidget                 = require('rex-widget');
var invariant                 = require('rex-widget/lib/invariant');
var {VBox, HBox}              = RexWidget.Layout;
var {boxShadow, border}       = RexWidget.StyleUtils;
var Breadcrumb                = require('./Breadcrumb');
var ServicePane               = require('./ServicePane');
var Actions                   = require('./Actions');
var ActionButton              = require('./ActionButton');
var WithDOMSize               = require('./WithDOMSize');
var {actionAllowedInContext}  = require('./getNextActions');

var SERVICE_PANE_ID = '__service__';

class WizardState {

  constructor(onUpdate, actions, size, panels, focus) {
    this._onUpdate = onUpdate;
    this._actions = actions;
    this.size = size;
    this._panels = panels || [];
    this.focus = focus;

    // derived state
    this.last = this._panels.length > 0 ?
      this._panels[this._panels.length - 1] :
      {actionTree: this._actions.tree, context: {}};
    this.context = this.last ? this.last.context : {};
    this.actions = this._actions.actions;
    this.actionTree = this.last ? this.last.actionTree : this._actions.tree;

    this.panels = this._panels.concat({
      id: SERVICE_PANE_ID,
      isService: true,
      context: this.context,
      actionTree: this.actionTree,
      element: <ServicePane style={{left: -15}} />,
      prev: this.last
    });
  }

  openAfterLast(id, contextUpdate) {
    invariant(this.actionTree[id] !== undefined);
    var actionTree = this.actionTree[id] || {};
    var element = this._actions.actions[id];
    var context = {...this.context, ...contextUpdate};
    var panels = this._panels.concat({
      id, actionTree, context, element,
      title: Actions.getTitle(element),
      icon: Actions.getIcon(element),
      prev: this.last
    });
    return this.construct(panels, panels.length - 1);
  }

  isTransitionAllowed(id) {
    var action = this.actions[id];
    invariant(action !== undefined);
    return actionAllowedInContext(this.context, action);
  }

  updateFocus(focus) {
    return this.construct(this._panels, focus);
  }

  moveFocusLeft() {
    if (this.focus > 0) {
      return this.updateFocus(this.focus - 1);
    } else {
      return this;
    }
  }

  moveFocusRight() {
    if (this.focus < this.panels.length - 1) {
      return this.updateFocus(this.focus + 1);
    } else {
      return this;
    }
  }

  updateContext(id, contextUpdate) {
    var nextPossibleAction = this._panels[this.indexOf(id) + 1];
    var state = this;
    state = state.close(id)
    state = state.openAfterLast(id, contextUpdate);
    var nextFocus = state.panels.length - 2;
    if (nextPossibleAction && state.isTransitionAllowed(nextPossibleAction.id)) {
      state = state.openAfterLast(nextPossibleAction.id);
      nextFocus = state.panels.length - 2;
    } else {
      var possibleActions = Object.keys(state.actionTree);
      for (var i = 0; i < possibleActions.length; i++) {
        var possibleAction = possibleActions[i];
        if (state.isTransitionAllowed(possibleAction)) {
          state = state.openAfterLast(possibleAction);
          nextFocus = state.panels.length - 2;
          break;
        }
      }
    }

    state = state.updateFocus(nextFocus);
    return state;
  }

  close(id) {
    var idx = this.indexOf(id);
    if (idx === -1) {
      return this;
    }
    var panels = this._panels.slice(0, idx);
    var focus = panels.length > 0 ? panels.length - 1 : null;
    return this.construct(panels, focus);
  }

  replaceFrom(id, replaceId) {
    var state = this;
    state = state.close(id);
    state = state.openAfterLast(replaceId);
    return state;
  }

  indexOf(id) {
    for (var i = 0; i < this.panels.length; i++) {
      if (this.panels[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  find(id) {
    var idx = this.indexOf(id);
    if (idx === -1) {
      return {
        idx,
        prev: null,
        panel: null,
        next: null
      };
    } else {
      return {
        idx,
        prev: this.panels[idx - 1],
        panel: this.panels[idx],
        next: this.panels[idx + 1]
      };
    }
  }

  update(func) {
    var state = this;
    if (func) {
      state = func(this);
    }
    this._onUpdate(state);
  }

  construct(panels, focus) {
    return new WizardState(this._onUpdate, this._actions, this._size, panels, focus);
  }

  static construct(onUpdate, actions, size) {
    var state = new this(onUpdate, actions, size);
    var first = Object.keys(actions.tree)[0];
    invariant(first !== undefined);
    return state.openAfterLast(first);
  }
}

var WizardItemStyle = {
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
          <VBox style={WizardItemStyle.sidebar}>
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
        <VBox style={{...WizardItemStyle.self, ...(!noTheme && WizardItemStyle.onThemed.self), ...style}}>
          {children}
          {!active &&
            <VBox
              style={{...WizardItemStyle.shim, ...(!noTheme && WizardItemStyle.onThemed.shim)}}
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

function getPanelWidth(panel) {
  var element = panel.element;
  var width = Actions.getWidth(element) || WizardItemStyle.self.minWidth;
  if (Object.keys(panel.prev.actionTree).length > 1) {
    width = width + WizardItemStyle.sidebar.width;
  }
  return width;
}

function computeCanvasMetrics(wizard, size, getActionByID) {
  var widthToDistribute;
  var seenWidth = 0;
  var scrollToIdx;
  var translateX = 0;
  var visiblePanels = [];
  for (var i = 0; i < wizard.panels.length; i++) {
    var panel = wizard.panels[i];
    var panelWidth = getPanelWidth(panel);
    if (i === wizard.focus) {
      scrollToIdx = i;
      widthToDistribute = size.width;
    }
    if (widthToDistribute !== undefined) {
      widthToDistribute = widthToDistribute - panelWidth;
      if (widthToDistribute >= -10) {
        visiblePanels.push(i);
      } else {
        break;
      }
    }
  }
  if (scrollToIdx > 0) {
    for (var i = scrollToIdx - 1; i >= 0; i--) {
      var panel = wizard.panels[i];
      var panelWidth = getPanelWidth(panel);
      translateX = translateX + panelWidth + WizardStyle.item.marginRight;
    }
  }

  translateX = Math.max(0, translateX - WizardStyle.item.marginRight * 4);

  return {
    translateX,
    visiblePanels
  };
}

var WizardStyle = {

  self: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },

  breadcrumb: {
    width: '100%',
    height: 38,
    boxShadow: boxShadow(0, 3, 6, 2, '#e2e2e2'),
    borderTop: border(1, 'solid', '#eaeaea')
  },

  item: {
    marginRight: 15
  },

  items: {
    overflow: 'hidden',
    width: '100%',
    flex: 1,

    background: '#eaeaea'
  },

  itemsCanvas: {
    flex: 1,
    transition: 'transform 0.5s'
  }
};


var Wizard = React.createClass({

  render() {
    if (this.props.DOMSize === null) {
      return <VBox style={WizardStyle.self} />;
    }

    var {translateX, visiblePanels, actionTree} = this.state;
    var panels = this.state.wizard.panels.map((p, i) =>
        <WizardItem
          ref={p.id}
          key={p.id}
          actionId={p.id}
          actions={this.props.actions.actions}
          siblingActions={p.isService ? [] : Object.keys(p.prev.actionTree)}
          active={visiblePanels.indexOf(i) !== -1}
          noTheme={p.isService}
          style={{...WizardStyle.item, zIndex: p.isService ? 999 : 1000}}
          onReplace={this.onReplace}
          onFocus={this.onFocus}>
          {cloneWithProps(p.element, {
            ref: p.id,
            context: {...p.context, USER: __REX_USER__},
            wizard: this.state.wizard,
            onContext: this.onContext.bind(null, p.id),
            onClose: this.onClose.bind(null, p.id)
          })}
        </WizardItem>
    );

    var breadcrumb = this.state.wizard.panels.map(p => ({
      id: p.id,
      icon: p.element.props.icon,
      title: Actions.getTitle(p.element)
    }));

    return (
      <VBox style={WizardStyle.self} tabIndex={-1}>
        <VBox ref="items" style={WizardStyle.items}>
          <HBox ref="itemsCanvas" style={{...WizardStyle.itemsCanvas, transform: `translate3d(-${translateX}px, 0, 0)`}}>
            {panels}
          </HBox>
        </VBox>
        <VBox style={WizardStyle.breadcrumb}>
          <Breadcrumb
            active={visiblePanels.map(i => this.state.wizard.panels[i].id)}
            items={breadcrumb}
            onClick={this.onFocus}
            />
        </VBox>
      </VBox>
    );
  },

  getInitialState() {
    return {
      wizard: null,
      visiblePanels: [],
      translateX: 0
    };
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.DOMSize !== this.props.DOMSize) {
      var size = nextProps.DOMSize;
      var wizard = this.state.wizard;
      if (wizard === null) {
        wizard = WizardState.construct(this.onWizardUpdate, this.props.actions, size);
      }
      var nextState = {
        ...this.computeCanvasMetrics(wizard, size),
        wizard
      };
      this.setState(nextState);
    }
  },

  onWizardUpdate(wizard) {
    if (wizard === this.state.wizard) {
      return;
    }

    console.log('CONTEXT', wizard.context);
    var onlyFocusUpdate = wizard._panels === this.state.wizard._panels;
    if (onlyFocusUpdate) {
      var metrics = this.computeCanvasMetrics(wizard);
      this.setState({wizard, ...metrics});
    } else {
      var currentFocus = this.state.wizard.focus;
      var targetFocus = wizard.focus;
      var moveRight = targetFocus > currentFocus;

      wizard = wizard.updateFocus(currentFocus);

      while (true) {
        var metrics = this.computeCanvasMetrics(wizard);
        if (metrics.visiblePanels.indexOf(targetFocus) !== -1) {
          this.setState({wizard, ...metrics});
          break;
        } else {
          if (moveRight) {
            wizard = wizard.moveFocusRight();
          } else {
            wizard = wizard.moveFocusLeft();
          }
        }
      }
    }
  },

  computeCanvasMetrics(wizard, size) {
    wizard = wizard || this.state.wizard;
    size = size || this.props.DOMSize;
    return computeCanvasMetrics(wizard, size);
  },

  onReplace(id, replaceId) {
    this.state.wizard
      .close(id)
      .openAfterLast(replaceId)
      .update();
  },

  onContext(id, context) {
    this.state.wizard
      .updateContext(id, context)
      .update();
  },

  onFocus(id) {
    var {panel, idx} = this.state.wizard.find(id);

    if (panel.isService) {
      idx = idx - 1;
    }

    var wizard = this.state.wizard;
    var focus = wizard.focus;

    var left = this.state.visiblePanels[0];
    var right = this.state.visiblePanels[this.state.visiblePanels.length - 1];

    var x = 10
    while (x--) {
      var metrics = this.computeCanvasMetrics(wizard);
      if (metrics.visiblePanels.indexOf(idx) !== -1) {
        break;
      } else if (focus < idx) {
        wizard = wizard.moveFocusRight();
      } else if (focus > idx) {
        wizard = wizard.moveFocusLeft();
      }
    }
    this.setState({
      wizard, ...metrics
    });
  },

  onClose(id) {
    this.state.wizard
      .close(id)
      .update();
  }

});

Wizard = WithDOMSize(Wizard);

module.exports = Wizard;
