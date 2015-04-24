/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react/addons');
var RexWidget                   = require('rex-widget/lib/modern');
var {VBox, HBox}                = RexWidget.Layout;
var NextActivities              = require('./NextActivities');

var ServicePaneStyle = {
};

var ServicePane = React.createClass({

  render() {
    return (
      <VBox style={{...ServicePaneStyle.self, width: this.props.width}}>
        {this.state.renderer(this.renderNextActivities())}
      </VBox>
    );
  },

  renderNextActivities() {
    return (
      <NextActivities
        context={this.props.context}
        activities={this.props.activities}
        onOpenActivity={this.props.onOpenActivity}
        nextActivities={this.props.nextActivities}
        openedActivities={this.props.openedActivities}
        />
    );
  },

  getInitialState() {
    return {
      renderer: RexWidget.emptyFunction.thatReturnsArgument
    };
  },

  renderInto(renderer) {
    renderer = renderer || RexWidget.emptyFunction.thatReturnsArgument;
    this.setState({renderer});
  },

  getDefaultProps() {
    return {
      activityIcon: 'chevron-right',
      activityName: null,
      width: 480
    };
  }
});

module.exports = ServicePane;
