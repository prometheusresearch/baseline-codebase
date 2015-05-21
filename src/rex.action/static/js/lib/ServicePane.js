/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var RexWidget       = require('rex-widget');
var {VBox, HBox}    = RexWidget.Layout;
var {border}        = RexWidget.StyleUtils;
var getNextActions  = require('./getNextActions');
var ActionButton    = require('./ActionButton');

var ServicePaneStyle = {
  self: {
    left: -15
  },
  header: {
    height: 25,
    margin: 0,
    padding: '5px 10px',
    color: '#999',
    borderBottom:  border(1, 'solid', '#ccc')
  },
  nextActions: {
    top: 25
  }
};

var ServicePane = React.createClass({

  render() {
    var nextActions = this.renderNextActions();
    return (
      <VBox style={{...ServicePaneStyle.self, width: this.props.width}}>
        {nextActions && 
          <VBox style={ServicePaneStyle.nextActions}>
            <h6 style={ServicePaneStyle.header}>Next Actions</h6>
            {nextActions}
          </VBox>}
      </VBox>
    );
  },

  renderNextActions() {
    var {context, actions, openedActions} = this.props;
    var emptyContext = Object.keys(context).length === 0;
    var nextActions = getNextActions(context, actions)
      .filter(action => this.props.nextActions.indexOf(action.id) > -1)
      .filter(action => openedActions.indexOf(action.id) === -1)
      .map(action => 
        <ActionButton
          key={action.id}
          action={action.action}
          actionId={action.id}
          onClick={this.props.onOpenAction}
          />
      )
    if (nextActions.length === 0) {
      return null;
    }
    return (
      {nextActions}
    );
  },

  getDefaultProps() {
    return {
      icon: 'chevron-right',
      title: null,
      width: 150
    };
  }
});

module.exports = ServicePane;
