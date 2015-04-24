/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react');
var RexWidget                   = require('rex-widget/lib/modern');
var {VBox, HBox}                = RexWidget.Layout;
var getNextActivities = require('./getNextActivities');
var ServiceSection              = require('./ServiceSection');

var NextActivitiesStyle = {
  button: {
    marginBottom: 5
  }
};

var NextActivities = React.createClass({
  render() {
    var {context, activities, openedActivities} = this.props;
    var emptyContext = Object.keys(context).length === 0;
    var nextActivities = getNextActivities(context, activities);
    var nextSteps = nextActivities
      .filter(activity => this.props.nextActivities.indexOf(activity.id) > -1)
      .filter(activity => openedActivities.indexOf(activity.id) === -1 && !emptyContext && activity.rank === 1)
      .map(activity => 
        <ActivityButton
          key={activity.id}
          activity={activity.activity}
          id={activity.id}
          style={NextActivitiesStyle.button}
          onClick={this.props.onOpenActivity}
          />
      )
    var possibleActivities = nextActivities
      .filter(activity => this.props.nextActivities.indexOf(activity.id) > -1)
      .filter(activity => openedActivities.indexOf(activity.id) === -1 && (emptyContext || activity.rank < 1))
      .map(activity => 
        <ActivityButton
          key={activity.id}
          activity={activity.activity}
          id={activity.id}
          style={NextActivitiesStyle.button}
          onClick={this.props.onOpenActivity}
          />
      )
    if (nextSteps.length === 0 && possibleActivities.length === 0) {
      return null;
    }
    return (
      <ServiceSection title="Actions">
        {nextSteps}
        {possibleActivities}
      </ServiceSection>
    );
  }
});

var ActivityButton = React.createClass({

  render() {
    var {activity, id, ...props} = this.props;
    return (
      <RexWidget.Button
        {...props}
        align="left"
        quiet
        icon={activity.props.activityIcon}
        onClick={this.props.onClick.bind(null, id)}>
        {activity.props.activityName}
      </RexWidget.Button>
    )
  }
});

module.exports = NextActivities;
