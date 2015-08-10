/**
 * @copyright 2015, Prometheus Research, LLC
 * @preventMunge
 */
'use strict';

var React                     = require('react');
var invariant                 = require('rex-widget/lib/invariant');
var qs                        = require('rex-widget/lib/qs');
var Actions                   = require('./Actions');
var ServicePane               = require('./ServicePane');
var WizardPanel               = require('./WizardPanel');
var isEntity                  = require('./isEntity');

var SERVICE_PANE_ID = '__service__';

class WizardState {

  constructor(onUpdate, initialContext, actions, size, panels, focus, canvasMetrics) {
    this._onUpdate = onUpdate;
    this._initialContext = initialContext;
    this._actions = actions;
    this.size = size;
    this._panels = panels || [];
    this.focus = focus || 0;

    // derived state
    this.last = this._panels.length > 0 ?
      this._panels[this._panels.length - 1] :
      {id: null, actionTree: this._actions.tree, context: this._initialContext};
    this.context = this.last.context;
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

  allowedSiblingTransitions(panel = this.last) {
    let transitions = [];
    if (panel.isService) {
      return transitions;
    }
    for (let id in panel.prev.actionTree) {
      if (panel.prev.actionTree.hasOwnProperty(id)) {
        let action = this.actions[id];
        if (action.props.contextTypes.input.match(panel.prev.context)) {
          transitions.push(id);
        }
      }
    }
    return transitions;
  }

  allowedNextTransitions(panel = this.last) {
    let transitions = Object.keys(panel.actionTree);
    let actionTransitions = this.panels.map(p => p.id);
    return transitions
      .filter(id =>
        this.isTransitionAllowed(id, panel.context) &&
        transitions.indexOf(id) > -1 &&
        actionTransitions.indexOf(id) === -1)
      .map(id => this.actions[id]);
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

  isTransitionAllowed(id, context = this.context) {
    var action = this.actions[id];
    invariant(action !== undefined);
    return action.props.contextTypes.input.match(context);
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
    var wizard = this;
    wizard = wizard
      .close(id)
      .openAfterLast(id, contextUpdate)
      .ensureVisible(id);
    if (nextPossibleAction && wizard.isTransitionAllowed(nextPossibleAction.id)) {
      wizard = wizard
        .openAfterLast(nextPossibleAction.id)
        .ensureVisible(nextPossibleAction.id);
    } else {
      var possibleActions = Object.keys(wizard.actionTree);
      for (var i = 0; i < possibleActions.length; i++) {
        var possibleAction = possibleActions[i];
        if (wizard.isTransitionAllowed(possibleAction)) {
          wizard = wizard
            .openAfterLast(possibleAction)
            .ensureVisible(possibleAction);
          break;
        }
      }
    }
    return wizard;
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
    return new WizardState(this._onUpdate, this._initialContext, this._actions, size, this._panels, this.focus);
  }

  construct(panels, focus, canvasMetrics) {
    if (focus === undefined) {
      focus = this.focus;
    }
    return new WizardState(this._onUpdate, this._initialContext, this._actions, this.size, panels, focus, canvasMetrics);
  }

  toQueryString() {
    var context = {};
    var contextAgg = {};
    this._panels.forEach(panel => {
      var panelContext = {};
      for (var k in panel.context) {
        if (k === 'USER') {
          continue;
        }
        let v = panel.context[k];
        if (isEntity(v)) {
          v = serializeEntity(v);
        } else if (v && typeof v.toQueryString === 'function') {
          v = v.toQueryString();
        }
        if (contextAgg[k] !== undefined && contextAgg[k] === v) {
          continue;
        }
        panelContext[k] = v;
        contextAgg[k] = v;
      }
      context[panel.id] = panelContext;
    });
    return qs.stringify({
      action: this._panels.map(panel => panel.id).join('/'),
      context: context,
      initialContext: this._initialContext
    });
  }

  static construct(onUpdate, initialContext, actions, size) {
    var wizard = new this(onUpdate, initialContext, actions, size);
    var first = Object.keys(actions.tree)[0];
    invariant(first !== undefined);
    return wizard.openAfterLast(first);
  }

  static fromQueryString(string, onUpdate, initialContext, actions, size) {
    var data = qs.parse(string);
    initialContext = data.initialContext || initialContext;
    var context = data.context || {};
    var ids = data.action || '';
    ids = ids.split('/').filter(Boolean);
    if (ids.length === 0) {
      return this.construct(onUpdate, initialContext, actions, size);
    } else {
      var wizard = new this(onUpdate, initialContext, actions, size);
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        wizard = wizard.openAfterLast(id, {...parseContext(context[id]), USER: "'" + __REX_USER__ + "'"});
      }
      return wizard;
    }
  }
}

const STATE_PREFIX = 'meta:state:';
const PARSE_ENTITY_RE = /~([a-zA-Z_]+)\/([^!]+)(![a-zA-Z_,]+)?/;

function parseEntity(str) { 
  let m = PARSE_ENTITY_RE.exec(str);
  if (!m) {
    return str;
  }
  let [_, type, id, state] = m;
  let entity = {
    'id': id,
    'meta:type': type,
  };
  if (state) {
    state = state.substring(1).split(',');
    for (let i = 0; i < state.length; i++) {
      entity[`meta:state:${state[i]}`] = true;
    }
  }
  return entity;
}

function serializeEntity(entity) {
  let state = [];
  let type = entity['meta:type'];
  for (let key in entity) {
    if (entity.hasOwnProperty(key) && key.indexOf(STATE_PREFIX) === 0 && entity[key]) {
      state.push(key.substring(STATE_PREFIX.length));
    }
  }
  let data = `~${type}/${entity.id}`;
  if (state.length > 0) {
    data = `${data}!${state.join(',')}`;
  }
  return data;
}

function parseContext(context) {
  if (!context) {
    return context;
  }
  let parsedContext = {};
  for (let key in context) {
    if (!context.hasOwnProperty(key)) {
      continue;
    }
    let value = context[key];
    if (value[0] === '~') {
      value = parseEntity(value);
    }
    parsedContext[key] = value;
  }
  return parsedContext;
}

function filterPanelContextToSerialize(context) {
  var result = {};
  for (var k in context) {
    if (k !== 'USER') {
      result[k] = context[k];
    }
  }
  return result;
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
