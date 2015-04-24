/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react/addons');
var {cloneWithProps}            = React.addons;
var constructComponent          = require('rex-widget/lib/Application').constructComponent;
var RexWidget                   = require('rex-widget/lib/modern');
var {VBox, HBox}                = RexWidget.Layout;
var {boxShadow, border}         = RexWidget.StyleUtils;
var Breadcrumb                  = require('./Breadcrumb');
var NextActivities              = require('./NextActivities');
var HomePane                    = require('./HomePane');
var ServicePane                 = require('./ServicePane');

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
    var {children, active, onActivate, style, noTheme} = this.props;
    return (
      <VBox style={{...WorkfowItemStyle.self, ...(!noTheme && WorkfowItemStyle.onThemed.self), ...style}}>
        {children}
        {!active && <VBox style={{...WorkfowItemStyle.shim, ...(!noTheme && WorkfowItemStyle.onThemed.shim)}} onClick={onActivate} />}
      </VBox>
    );
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

function computeCanvas(activities, focus, size, getActivityByID) {
  var widthToDistribute;
  var scrollToIdx;
  var translateX = 0;
  var visibleIds = [];
  for (var i = 0; i < activities.length; i++) {
    var id = activities[i].id;
    var activity = getActivityByID(id);
    if (id === focus) {
      scrollToIdx = i;
      widthToDistribute = size.width;
    }
    if (widthToDistribute !== undefined) {
      widthToDistribute = widthToDistribute - (activity.props.width || 480);
      if (widthToDistribute >= 0) {
        visibleIds.push(id);
      } else {
        break;
      }
    }
  }
  if (scrollToIdx > 0) {
    for (var i = scrollToIdx - 1; i >= 0; i--) {
      var id = activities[i].id;
      var activity = getActivityByID(id);

      translateX = translateX + (activity.props.width || 480) + WorkflowStyle.item.marginRight;

      widthToDistribute = widthToDistribute - (activity.props.width || 480);
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

    var activities = this._activities();
    var {translateX, visibleIds, activityTree} = this.state;

    console.log('RENDER', activityTree, this.state.context);

    var activities = this._activities().map((a, idx) => {
      var activity = this._activityByID(a.id);
      return (
        <WorkfowItem
          ref={a.id}
          key={a.id}
          noTheme={a.id === '__service__'}
          style={WorkflowStyle.item}
          active={visibleIds.indexOf(a.id) !== -1}
          onActivate={this.onActivate.bind(null, a.id)}>
          {cloneWithProps(activity, {
            ref: a.id,
            context: a.context,
            onContext: this.onContext.bind(null, a.id),
            onClose: this.onClose.bind(null, a.id)
          })}
        </WorkfowItem>
      );
    });
    var breadcrumb = this._activities()
      .map(a => {
        var activity = this._activityByID(a.id);
        return {
          id: a.id,
          icon: activity.props.activityIcon,
          title: activity.props.activityName
        };
      });
    return (
      <VBox style={WorkflowStyle.self}>
        <VBox ref="items" style={WorkflowStyle.items}>
          <HBox ref="itemsCanvas" style={{...WorkflowStyle.itemsCanvas, transform: `translate3d(-${translateX}px, 0, 0)`}}>
            {activities}
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
    return {
      size: null,
      scrollTo: '__home__',
      context: {},
      activities: [],
      activityTree: this.props.activityTree
    };
  },

  componentDidMount() {
    if (this.state.size === null) {
      var node = this.getDOMNode();
      var {width, height} = node.getBoundingClientRect();
      this.setState({
        size: {width, height},
        ...this._getCanvasState(this._activities(), this.state.scrollTo, {width, height})
      });
    }
  },

  componentDidUpdate() {
    var active = this.state.activities[this.state.activities.length - 1].id;
    var renderer = this.refs[active].renderService;
    this.refs.__service__.renderInto(renderer);
  },

  _getCanvasState(activities, focus, size) {
    size = size || this.state.size;
    return computeCanvas(activities, focus, size, this._activityByID);
  },

  _activityByID(id) {
    if (id === '__service__') {
      return (
        <ServicePane
          context={this.state.context}
          activities={this.props.activities}
          onOpenActivity={this.onOpen}
          openedActivities={this.state.activities.map(a => a.id)}
          nextActivities={Object.keys(this.state.activityTree || {})}
          />
      );
    } else if (id === '__home__') {
      return (
        <HomePane />
      );
    } else {
      return constructComponent(this.props.activities[id]);
    }
  },

  _activities(activities) {
    activities = activities || this.state.activities;
    activities = activities.slice(0);
    activities.push({
      id: '__service__',
      context: this.state.context,
      activityTree: this.props.activityTree
    });
    activities.unshift({
      id: '__home__',
      context: {},
      activityTree: this.props.activityTree
    });
    return activities;
  },

  onContext(id, context) {
    var activities = this._activities();
    var a = this._findActivityByID(id);
    var activityTree;
    if (a.idx > -1) {
      var nextActivities = [];
      for (var idx = 0; idx < activities.length; idx++) {
        var b = activities[idx];
        if (b.id === '__service__' || b.id === '__home__') {
          continue;
        }
        if (idx < a.idx) {
          nextActivities.push(b);
        } else if (idx === a.idx) {
          activityTree = b.activityTree;
          nextActivities.push({...b, context});
        } else {
          break;
        }
      }
      this.setState({
        context,
        activityTree,
        activities: nextActivities,
        ...this._getCanvasState(this._activities(nextActivities), this.state.scrollTo)
      });
    }
  },

  onOpen(id) {
    console.log('OPEN');
    var {context, activityTree} = this.state;
    activityTree = activityTree[id];
    var activities = this.state.activities.concat({id, context, activityTree});
    this.setState({
      activities,
      activityTree,
      scrollTo: id,
        ...this._getCanvasState(this._activities(activities), id)
    });
  },

  onActivate(id) {
    if (id === '__service__') {
      id = this.state.activities[this.state.activities.length - 1].id;
    }
    var left = this._findActivityByID(this.state.visibleIds[0]);
    var right = this._findActivityByID(this.state.visibleIds[this.state.visibleIds.length - 1]);
    var active = this._findActivityByID(this.state.scrollTo);
    var nextActive = this._findActivityByID(id);
    if (nextActive.idx > -1) {
      if (active.idx < nextActive.idx && Math.abs(right.idx - nextActive.idx) === 1) {
        id = active.next.id;
      } else if (active.idx > nextActive.idx && Math.abs(left.idx - nextActive.idx) === 1) {
        id = active.prev.id;
      }
      this.setState({
        scrollTo: id,
        ...this._getCanvasState(this._activities(), id)
      });
    }
  },

  onClose(id) {
    console.log('CLOSE', id);
    var activities = this._activities();
    var a = this._findActivityByID(id);
    if (a.idx > -1) {
      var nextActivities = [];
      for (var idx = 0; idx < activities.length; idx++) {
        var b = activities[idx];
        if (b.id === '__service__' || b.id === '__home__') {
          continue;
        }
        if (idx < a.idx) {
          nextActivities.push(b);
        } else {
          break;
        }
      }
      console.log(a.prev.id, a.prev.activityTree, a.prev.context);
      this.setState({
        scrollTo: a.prev.id,
        context: a.prev.context,
        activityTree: a.prev.activityTree,
        activities: nextActivities,
        ...this._getCanvasState(this._activities(nextActivities), a.prev.id)
      });
    }
  },

  _findActivityByID(id) {
    var activities = this._activities();
    for (var i = 0; i < activities.length; i++) {
      var activity = activities[i];
      if (activity.id === id) {
        return {idx: i, activity, prev: activities[i - 1], next: activities[i + 1]};
      }
    }
    return {idx: -1, activity: null};
  }
});

module.exports = Workflow;
