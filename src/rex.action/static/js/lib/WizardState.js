/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

var invariant                 = require('rex-widget/lib/invariant');
var {actionAllowedInContext}  = require('./getNextActions');
var Actions                   = require('./Actions');
var ServicePane               = require('./ServicePane');
var WizardPanel               = require('./WizardPanel');

var SERVICE_PANE_ID = '__service__';

class WizardState {

  constructor(onUpdate, actions, size, panels, focus, canvasMetrics) {
    this._onUpdate = onUpdate;
    this._actions = actions;
    this.size = size;
    this._panels = panels || [];
    this.focus = focus || 0;

    // derived state
    this.last = this._panels.length > 0 ?
      this._panels[this._panels.length - 1] :
      {id: null, actionTree: this._actions.tree, context: {}};
    this.context = this.last ? this.last.context : {};
    this.actions = this._actions.actions;
    this.actionTree = this.last ? this.last.actionTree : this._actions.tree;

    this.panels = this._panels.concat({
      id: SERVICE_PANE_ID,
      isService: true,
      context: this.context,
      actionTree: this.actionTree,
      element: <ServicePane style={{left: this._panels.length > 0 ? -15 : 0}} />,
      prev: this.last
    });

    this.canvasMetrics = canvasMetrics || computeCanvasMetrics(this);
  }

  isVisible(id) {
    var {idx} = this.find(id);
    return this.canvasMetrics.visiblePanels.indexOf(idx) > -1;
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
    return this.construct(panels).ensureVisible(id);
  }

  isTransitionAllowed(id) {
    var action = this.actions[id];
    invariant(action !== undefined);
    return actionAllowedInContext(this.context, action);
  }

  /**
   * Put focus on a panel by an ID.
   */
  ensureVisible(id) {
    var wizard = this;
    var {panel, idx: targetFocus} = this.find(id);
    if (targetFocus === -1) {
      return wizard;
    }
    while (true) {
      if (wizard.canvasMetrics.visiblePanels.indexOf(targetFocus) > -1) {
        break;
      } else if (wizard.focus < targetFocus) {
        wizard = wizard.moveFocusRight();
      } else if (wizard.focus > targetFocus) {
        wizard = wizard.moveFocusLeft();
      }
    }
    return wizard;
  }

  moveFocusLeft() {
    if (this.focus > 0) {
      return this.construct(this._panels, this.focus - 1);
    } else {
      return this;
    }
  }

  moveFocusRight() {
    if (this.focus < this.panels.length - 1) {
      return this.construct(this._panels, this.focus + 1);
    } else {
      return this;
    }
  }

  updateContext(id, contextUpdate) {
    var nextPossibleAction = this._panels[this.indexOf(id) + 1];
    var state = this;
    state = state
      .close(id)
      .openAfterLast(id, contextUpdate)
      .ensureVisible(id);
    if (nextPossibleAction && state.isTransitionAllowed(nextPossibleAction.id)) {
      state = state
        .openAfterLast(nextPossibleAction.id)
        .ensureVisible(nextPossibleAction.id);
    } else {
      var possibleActions = Object.keys(state.actionTree);
      for (var i = 0; i < possibleActions.length; i++) {
        var possibleAction = possibleActions[i];
        if (state.isTransitionAllowed(possibleAction)) {
          state = state
            .openAfterLast(possibleAction)
            .ensureVisible(possibleAction);
          break;
        }
      }
    }
    return state;
  }

  close(id) {
    var idx = this.indexOf(id);
    if (idx === -1) {
      return this;
    }
    var panels = this._panels.slice(0, idx);
    return this.construct(panels);
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

  resize(size) {
    return new WizardState(this._onUpdate, this._actions, size, this._panels, this.focus);
  }

  construct(panels, focus, canvasMetrics) {
    if (focus === undefined) {
      focus = this.focus;
    }
    return new WizardState(this._onUpdate, this._actions, this.size, panels, focus, canvasMetrics);
  }

  static construct(onUpdate, actions, size) {
    var state = new this(onUpdate, actions, size);
    var first = Object.keys(actions.tree)[0];
    invariant(first !== undefined);
    return state.openAfterLast(first);
  }
}

/**
 * Compute width for a specific panel within the wizard.
 */
function computePanelWidth(panel) {
  var element = panel.element;
  var width = Actions.getWidth(element) || WizardPanel.Style.self.minWidth;
  if (Object.keys(panel.prev.actionTree).length > 1) {
    width = width + WizardPanel.Style.sidebar.width;
  }
  return width;
}

function computeCanvasMetrics(wizard) {
  var widthToDistribute;
  var seenWidth = 0;
  var scrollToIdx;
  var translateX = 0;
  var visiblePanels = [];

  for (var i = 0; i < wizard.panels.length; i++) {
    var panel = wizard.panels[i];
    var panelWidth = computePanelWidth(panel);
    if (i === wizard.focus) {
      scrollToIdx = i;
      widthToDistribute = wizard.size.width;
    }
    if (widthToDistribute !== undefined) {
      widthToDistribute = widthToDistribute - panelWidth;
      if (widthToDistribute >= 0) {
        visiblePanels.push(i);
      } else {
        break;
      }
    }
  }
  if (scrollToIdx > 0) {
    for (var i = scrollToIdx - 1; i >= 0; i--) {
      var panel = wizard.panels[i];
      var panelWidth = computePanelWidth(panel);
      translateX = translateX + panelWidth + 15 /*WizardStyle.item.marginRight*/;
    }
  }

  translateX = Math.max(0, translateX - 15 /*WizardStyle.item.marginRight*/ * 4);

  return {
    translateX,
    visiblePanels
  };
}

module.exports = WizardState;
