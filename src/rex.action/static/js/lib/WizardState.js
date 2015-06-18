/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

var invariant                 = require('rex-widget/lib/invariant');
var {actionAllowedInContext}  = require('./getNextActions');
var Actions                   = require('./Actions');
var ServicePane               = require('./ServicePane');

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

module.exports = WizardState;
