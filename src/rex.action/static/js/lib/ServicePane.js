/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React        = require('react/addons');
var RexWidget    = require('rex-widget');
var {VBox, HBox} = RexWidget.Layout;
var NextActions  = require('./NextActions');

var ServicePaneStyle = {

};

var ServicePane = React.createClass({

  render() {
    return (
      <VBox style={{...ServicePaneStyle.self, width: this.props.width}}>
        {this.state.renderer(this.renderNextActions())}
      </VBox>
    );
  },

  renderNextActions() {
    return (
      <NextActions
        context={this.props.context}
        actions={this.props.actions}
        onOpenAction={this.props.onOpenAction}
        nextActions={this.props.nextActions}
        openedActions={this.props.openedActions}
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
      icon: 'chevron-right',
      title: null,
      width: 480
    };
  }
});

module.exports = ServicePane;
