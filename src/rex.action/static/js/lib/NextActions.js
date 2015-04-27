/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react');
var RexWidget       = require('rex-widget/lib/modern');
var {VBox, HBox}    = RexWidget.Layout;
var getNextActions  = require('./getNextActions');
var ServiceSection  = require('./ServiceSection');

var NextActionsStyle = {
  button: {
    marginBottom: 5
  }
};

var NextActions = React.createClass({
  render() {
    var {context, actions, openedActions} = this.props;
    var emptyContext = Object.keys(context).length === 0;
    var nextActions = getNextActions(context, actions)
      .filter(action => this.props.nextActions.indexOf(action.id) > -1)
      .filter(action => openedActions.indexOf(action.id) === -1)
      .map(action => 
        <ActionButton
          key={action.id}
          action={action.action}
          id={action.id}
          style={NextActionsStyle.button}
          onClick={this.props.onOpenAction}
          />
      )
    if (nextActions.length === 0) {
      return null;
    }
    return (
      <ServiceSection title="Next Actions">
        {nextActions}
      </ServiceSection>
    );
  }
});

var ActionButton = React.createClass({

  render() {
    var {action, id, ...props} = this.props;
    return (
      <RexWidget.Button
        {...props}
        align="left"
        quiet
        icon={action.props.icon}
        onClick={this.props.onClick.bind(null, id)}>
        {action.props.title}
      </RexWidget.Button>
    )
  }
});

module.exports = NextActions;
