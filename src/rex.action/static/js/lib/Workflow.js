/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react/addons');
var {cloneWithProps}    = React.addons;
var RexWidget           = require('rex-widget');
var invariant           = require('rex-widget/lib/invariant');
var {VBox, HBox}        = RexWidget.Layout;
var {boxShadow, border} = RexWidget.StyleUtils;
var Breadcrumb          = require('./Breadcrumb');
var ServicePane         = require('./ServicePane');
var Actions             = require('./Actions');
var ActionButton        = require('./ActionButton');

var SERVICE_PANE_ID = '__service__';

class WorkflowState {

  constructor(onUpdate, actions, panels, focus) {
    this._onUpdate = onUpdate;
    this._actions = actions;
    this._panels = panels || [];
    this.focus = focus || null;

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
      element: <ServicePane />,
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
    return this.construct(panels, id);
  }

  updateFocus(id) {
    return this.construct(this._panels, id);
  }

  close(id) {
    var idx = this.indexOf(id);
    if (idx === -1) {
      return this;
    }
    var panels = this._panels.slice(0, idx);
    var focus = panels.length > 0 ? panels[panels.length - 1].id : null;
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
    return new WorkflowState(this._onUpdate, this._actions, panels, focus);
  }

  static construct(onUpdate, actions) {
    var state = new this(onUpdate, actions);
    var first = Object.keys(actions.tree)[0];
    invariant(first !== undefined);
    return state.openAfterLast(first);
  }
}

var WorkfowItemStyle = {
  self: {
    minWidth: 480
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

var WorkflowItem = React.createClass({

  render() {
    var {children, active, style, actions, siblingActions, actionId, noTheme} = this.props;
    return (
      <HBox>
        {siblingActions.length > 1 &&
          <VBox style={WorkfowItemStyle.sidebar}>
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
        <VBox style={{...WorkfowItemStyle.self, ...(!noTheme && WorkfowItemStyle.onThemed.self), ...style}}>
          {children}
          {!active &&
            <VBox
              style={{...WorkfowItemStyle.shim, ...(!noTheme && WorkfowItemStyle.onThemed.shim)}}
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

var WorkflowStyle = {

  self: {
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

function getPanelWidth(panel) {
  var element = panel.element;
  var width = Actions.getWidth(element) || 480;
  if (Object.keys(panel.prev.actionTree).length > 1) {
    width = width + WorkfowItemStyle.sidebar.width;
  }
  return width;
}

function computeCanvasMetrics(workflow, size, getActionByID) {
  var widthToDistribute;
  var scrollToIdx;
  var translateX = 0;
  var visiblePanels = [];
  for (var i = 0; i < workflow.panels.length; i++) {
    var panel = workflow.panels[i];
    var panelWidth = getPanelWidth(panel);
    if (panel.id === workflow.focus) {
      scrollToIdx = i;
      widthToDistribute = size.width;
    }
    if (widthToDistribute !== undefined) {
      widthToDistribute = widthToDistribute - panelWidth;
      if (widthToDistribute >= -10) {
        visiblePanels.push(panel.id);
      } else {
        break;
      }
    }
  }
  if (scrollToIdx > 0) {
    for (var i = scrollToIdx - 1; i >= 0; i--) {
      var panel = workflow.panels[i];
      var panelWidth = getPanelWidth(panel);

      translateX = translateX + panelWidth + WorkflowStyle.item.marginRight;

      widthToDistribute = widthToDistribute - panelWidth;
      if (widthToDistribute >= -10) {
        visiblePanels.unshift(panel.id);
      }
    }
  }

  translateX = Math.max(0, translateX - WorkflowStyle.item.marginRight * 4);

  return {
    translateX,
    visiblePanels
  };
}

function WithDOMSize(Component) {
  return React.createClass({

    displayName: `WithDOMSize(${Component.displayName || Component.name})`,

    render() {
      return (
        <Component
          {...this.props}
          DOMSize={this.state.DOMSize}
          />
      );
    },

    getInitialState() {
      return {DOMSize: null};
    },

    componentDidMount() {
      if (this.state.DOMSize === null) {
        this.computeSize();
      }
      window.addEventListener('resize', this.computeSize);
    },

    componentWillUnmount() {
      window.removeEventListener('resize', this.computeSize);
    },

    onWindowResize() {
      this.computeSize();
    },

    computeSize() {
      var node = this.getDOMNode();
      var {width, height} = node.getBoundingClientRect();
      this.setState({DOMSize: {width, height}});
    }
  });
};

var Workflow = React.createClass({

  render() {
    if (this.props.DOMSize === null) {
      return <VBox style={WorkflowStyle.self} />;
    }

    var {translateX, visiblePanels, actionTree} = this.state;
    var panels = this.state.workflow.panels.map(p =>
        <WorkflowItem
          ref={p.id}
          key={p.id}
          actionId={p.id}
          actions={this.props.actions.actions}
          siblingActions={p.isService ? [] : Object.keys(p.prev.actionTree)}
          active={visiblePanels.indexOf(p.id) !== -1}
          noTheme={p.isService}
          style={{...WorkflowStyle.item, zIndex: p.isService ? 999 : 1000}}
          onReplace={this.onReplace}
          onFocus={this.onFocus}>
          {cloneWithProps(p.element, {
            ref: p.id,
            context: p.context,
            workflow: this.state.workflow,
            onContext: this.onContext.bind(null, p.id),
            onClose: this.onClose.bind(null, p.id)
          })}
        </WorkflowItem>
    );

    var breadcrumb = this.state.workflow.panels.map(p => ({
      id: p.id,
      icon: p.element.props.icon,
      title: Actions.getTitle(p.element)
    }));

    return (
      <VBox style={WorkflowStyle.self}>
        <VBox ref="items" style={WorkflowStyle.items}>
          <HBox ref="itemsCanvas" style={{...WorkflowStyle.itemsCanvas, transform: `translate3d(-${translateX}px, 0, 0)`}}>
            {panels}
          </HBox>
        </VBox>
        <VBox style={WorkflowStyle.breadcrumb}>
          <Breadcrumb
            active={visiblePanels}
            items={breadcrumb}
            onClick={this.onFocus}
            />
        </VBox>
      </VBox>
    );
  },

  getInitialState() {
    return {
      workflow: WorkflowState.construct(this.onWorkflowUpdate, this.props.actions),
      visiblePanels: [],
      translateX: 0
    };
  },

  onWorkflowUpdate(workflow) {
    var nextState = {
      workflow,
      ...this.computeCanvasMetrics(workflow)
    };
    this.setState(nextState);
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.DOMSize !== this.props.DOMSize) {
      this.setState(this.computeCanvasMetrics(this.state.workflow, nextProps.DOMSize));
    }
  },

  computeCanvasMetrics(workflow, size) {
    workflow = workflow || this.state.workflow;
    size = size || this.props.DOMSize;
    return computeCanvasMetrics(workflow, size);
  },

  onReplace(id, replaceId) {
    this.state.workflow
      .close(id)
      .openAfterLast(replaceId)
      .update();
  },

  onContext(id, context) {
    this.state.workflow
      .close(id)
      .openAfterLast(id, context)
      .update();
  },

  onFocus(id) {
    var {workflow, visiblePanels} = this.state;
    var {panel, prevPanel, nextPanel, idx} = workflow.find(id);

    var {focusPanel, prevFocusPanel, nextFocusPanel, focusIdx} = workflow.find(id);
    if (panel.isService) {
      panel = panel.prev;
    }

    var leftIdx = workflow.indexOf(visiblePanels[0]);
    var rightIdx = workflow.indexOf(visiblePanels[visiblePanels.length - 1]);

    if (idx > -1) {
      if (focusIdx < idx && Math.abs(rightIdx - idx) === 1) {
        id = nextFocusPanel.id;
      } else if (focusIdx > idx && Math.abs(leftIdx - idx) === 1) {
        id = prevFocusPanel.id;
      }
      workflow
        .updateFocus(id)
        .update();
    }
  },

  onClose(id) {
    this.state.workflow
      .close(id)
      .update();
  }

});

Workflow = WithDOMSize(Workflow);

module.exports = Workflow;
