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
    var {workflow} = this.props;
    var nextActions = Object.keys(workflow.actionTree);
    var openedActions = workflow.panels.map(p => p.id);
    var actionButtons = getNextActions(workflow.context, nextActions, workflow.actions)
      .filter(action => nextActions.indexOf(action.id) > -1)
      .filter(action => openedActions.indexOf(action.id) === -1)
      .map(action => 
        <ActionButton
          key={action.id}
          action={action.action}
          actionId={action.id}
          onClick={this.onOpen}
          />
      );

    return (
      <VBox style={{...ServicePaneStyle.self, width: this.props.width, ...this.props.style}}>
        {actionButtons.length > 0 && 
          <VBox style={ServicePaneStyle.nextActions}>
            <h6 style={ServicePaneStyle.header}>Next Actions</h6>
            {actionButtons}
          </VBox>}
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      icon: 'chevron-right',
      title: null,
      width: 150
    };
  },

  onOpen(id) {
    this.props.workflow
      .openAfterLast(id)
      .update();
  }
});

module.exports = ServicePane;
