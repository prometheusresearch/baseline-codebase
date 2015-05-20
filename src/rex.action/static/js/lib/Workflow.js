/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react/addons');
var {cloneWithProps}    = React.addons;
var RexWidget           = require('rex-widget');
var {VBox, HBox}        = RexWidget.Layout;
var {boxShadow, border} = RexWidget.StyleUtils;
var Breadcrumb          = require('./Breadcrumb');
var ServicePane         = require('./ServicePane');
var Actions             = require('./Actions');

var ActionButtonStyle = {
  self: {
    padding: 10,
    color: '#888',
    fontWeight: 'bold',
    textAlign: 'right',
    cursor: 'pointer',
    fontSize: '90%'
  },
  icon: {
    top: 2,
    marginLeft: 7,
    marginRight: 7
  },
  onActive: {
    self: {
      background: 'linear-gradient(to right, #eaeaea 0%,#ffffff 100%)',
      color: '#000'
    }
  },
  onHover: {
    self: {
      background: 'linear-gradient(to right, #eaeaea 0%,#f1f1f1 100%)',
    }
  }
};

var ActionButton = React.createClass({

  render() {
    var {action, active, hover, ...props} = this.props;
    var style = {
      ...ActionButtonStyle.self,
      ...(hover && ActionButtonStyle.onHover.self),
      ...(active && ActionButtonStyle.onActive.self),
      flexDirection: 'row-reverse'
    };
    return (
      <HBox {...props} style={style} alignItems="right" onClick={this.onClick}>
        {Actions.getTitle(action)}
      </HBox>
    );
  },

  onClick() {
    this.props.onClick(this.props.actionId);
  }
});

ActionButton = RexWidget.Hoverable(ActionButton);

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
  alternative: {
    width: 200
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

var WorkfowItem = React.createClass({

  render() {
    var {children, active, style, actions, actionTree, actionId, noTheme} = this.props;
    return (
      <HBox>
        {actionTree.length > 0 &&
          <VBox style={WorkfowItemStyle.alternative}>
            {actionTree.map(id => {
              var action = actions[id];
              return (
                <ActionButton
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
              onClick={this.onActivate}
              />}
        </VBox>
      </HBox>
    );
  },

  onActivate() {
    this.props.onActivate(this.props.actionId);
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
    height: 40,
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

function computeCanvas(actions, focus, size, getActionByID) {
  var widthToDistribute;
  var scrollToIdx;
  var translateX = 0;
  var visibleIds = [];
  for (var i = 0; i < actions.length; i++) {
    var id = actions[i].id;
    var action = getActionByID(id);
    if (id === focus) {
      scrollToIdx = i;
      widthToDistribute = size.width;
    }
    if (widthToDistribute !== undefined) {
      widthToDistribute = widthToDistribute - (action.props.width || 480);
      if (widthToDistribute >= 0) {
        visibleIds.push(id);
      } else {
        break;
      }
    }
  }
  if (scrollToIdx > 0) {
    for (var i = scrollToIdx - 1; i >= 0; i--) {
      var id = actions[i].id;
      var action = getActionByID(id);

      translateX = translateX + (action.props.width || 480) + WorkflowStyle.item.marginRight;

      widthToDistribute = widthToDistribute - (action.props.width || 480);
      if (widthToDistribute >= 0) {
        visibleIds.unshift(id);
      }
    }
  }

  translateX = Math.max(0, translateX - WorkflowStyle.item.marginRight * 4);

  return {
    translateX,
    visibleIds
  };
}

var Workflow = React.createClass({

  render() {
    if (this.state.size === null) {
      return <VBox style={WorkflowStyle.self} />;
    }

    var actions = this._actions();
    var {translateX, visibleIds, actionTree} = this.state;

    console.log('RENDER', actionTree, this.state.context);

    var prevActionsTree = this.props.actions.tree;
    var actions = this._actions().map((a, idx) => {
      var action = this._actionByID(a.id);
      var item = (
        <WorkfowItem
          ref={a.id}
          key={a.id}
          noTheme={a.id === '__service__'}
          style={WorkflowStyle.item}
          active={visibleIds.indexOf(a.id) !== -1}
          actions={this.props.actions.actions}
          actionId={a.id}
          actionTree={a.id === '__service__' ? [] : Object.keys(prevActionsTree || {})}
          onReplace={this.onReplace}
          onActivate={this.onActivate}>
          {cloneWithProps(action, {
            ref: a.id,
            context: a.context,
            onContext: this.onContext.bind(null, a.id),
            onClose: this.onClose.bind(null, a.id)
          })}
        </WorkfowItem>
      );
      prevActionsTree = a.actionTree;
      return item;
    });

    var breadcrumb = this._actions()
      .map(a => {
        var action = this._actionByID(a.id);
        return {
          id: a.id,
          icon: action.props.icon,
          title: Actions.getTitle(action)
        };
      });
    return (
      <VBox style={WorkflowStyle.self}>
        <VBox ref="items" style={WorkflowStyle.items}>
          <HBox ref="itemsCanvas" style={{...WorkflowStyle.itemsCanvas, transform: `translate3d(-${translateX}px, 0, 0)`}}>
            {actions}
          </HBox>
        </VBox>
        <VBox style={WorkflowStyle.breadcrumb}>
          <Breadcrumb
            active={visibleIds}
            items={breadcrumb}
            onClick={this.onActivate}
            />
        </VBox>
      </VBox>
    );
  },

  getInitialState() {
    var scrollTo = Object.keys(this.props.actions.tree)[0];
    var context = {};
    var actionTree = this.props.actions.tree[scrollTo];
    return {
      size: null,
      scrollTo,
      context,
      actions: [{
        id: scrollTo,
        context,
        actionTree
      }],
      actionTree
    };
  },

  componentDidMount() {
    if (this.state.size === null) {
      var node = this.getDOMNode();
      var {width, height} = node.getBoundingClientRect();
      this.setState({
        size: {width, height},
        ...this._getCanvasState(this._actions(), this.state.scrollTo, {width, height})
      });
    }
  },

  _getCanvasState(actions, focus, size) {
    size = size || this.state.size;
    return computeCanvas(actions, focus, size, this._actionByID);
  },

  _actionByID(id) {
    if (id === '__service__') {
      var servicePane = (
        <ServicePane
          context={this.state.context}
          actions={this.props.actions.actions}
          onOpenAction={this.onOpen}
          openedActions={this.state.actions.map(a => a.id)}
          nextActions={Object.keys(this.state.actionTree || {})}
          />
      );
      return servicePane;
    } else {
      return this.props.actions.actions[id];
    }
  },

  _actions(actions) {
    actions = actions || this.state.actions;
    actions = actions.slice(0);
    actions.push({
      id: '__service__',
      context: this.state.context,
      actionTree: this.props.actions.tree
    });
    return actions;
  },

  onReplace(id, nextId) {
    var a = this._findActionByID(id);
    var nextActions = [];
    for (var idx = 0; idx < this.state.actions.length; idx++) {
      var b = this.state.actions[idx];
      if (b.id === '__service__') {
        continue;
      }
      if (idx < a.idx) {
        nextActions.push(b);
      } else {
        break;
      }
    }
    var context = a.prev ? a.prev.context : {};
    var actionTree = (a.prev ? a.prev.actionTree : this.props.actions.tree)[nextId];
    nextActions = nextActions.concat({id: nextId, context, actionTree});
    this.setState({
      actions: nextActions,
      actionTree,
      scrollTo: nextId,
      ...this._getCanvasState(this._actions(nextActions), nextId)
    });
  },

  onContext(id, context) {
    var actions = this._actions();
    var a = this._findActionByID(id);
    var actionTree;
    if (a.idx > -1) {
      var nextActions = [];
      for (var idx = 0; idx < actions.length; idx++) {
        var b = actions[idx];
        if (b.id === '__service__') {
          continue;
        }
        if (idx < a.idx) {
          nextActions.push(b);
        } else if (idx === a.idx) {
          actionTree = b.actionTree;
          nextActions.push({...b, context});
        } else {
          break;
        }
      }
      this.setState({
        context,
        actionTree,
        actions: nextActions,
        ...this._getCanvasState(this._actions(nextActions), this.state.scrollTo)
      });
    }
  },

  onOpen(id) {
    console.log('OPEN');
    var {context, actionTree} = this.state;
    actionTree = actionTree[id];
    var actions = this.state.actions.concat({id, context, actionTree});
    this.setState({
      actions,
      actionTree,
      scrollTo: id,
        ...this._getCanvasState(this._actions(actions), id)
    });
  },

  onActivate(id) {
    if (id === '__service__') {
      id = this.state.actions[this.state.actions.length - 1].id;
    }
    var left = this._findActionByID(this.state.visibleIds[0]);
    var right = this._findActionByID(this.state.visibleIds[this.state.visibleIds.length - 1]);
    var active = this._findActionByID(this.state.scrollTo);
    var nextActive = this._findActionByID(id);
    if (nextActive.idx > -1) {
      if (active.idx < nextActive.idx && Math.abs(right.idx - nextActive.idx) === 1) {
        id = active.next.id;
      } else if (active.idx > nextActive.idx && Math.abs(left.idx - nextActive.idx) === 1) {
        id = active.prev.id;
      }
      this.setState({
        scrollTo: id,
        ...this._getCanvasState(this._actions(), id)
      });
    }
  },

  onClose(id) {
    console.log('CLOSE', id);
    var actions = this._actions();
    var a = this._findActionByID(id);
    if (a.idx > -1) {
      var nextActions = [];
      for (var idx = 0; idx < actions.length; idx++) {
        var b = actions[idx];
        if (b.id === '__service__') {
          continue;
        }
        if (idx < a.idx) {
          nextActions.push(b);
        } else {
          break;
        }
      }
      this.setState({
        scrollTo: a.prev.id,
        context: a.prev.context,
        actionTree: a.prev.actionTree,
        actions: nextActions,
        ...this._getCanvasState(this._actions(nextActions), a.prev.id)
      });
    }
  },

  _findActionByID(id) {
    var actions = this._actions();
    for (var i = 0; i < actions.length; i++) {
      var action = actions[i];
      if (action.id === id) {
        return {idx: i, action, prev: actions[i - 1], next: actions[i + 1]};
      }
    }
    return {idx: -1, action: null};
  }
});

module.exports = Workflow;
