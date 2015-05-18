'use strict';

var RexWidget    = require('rex-widget');
var {HBox, VBox} = RexWidget.Layout;

var TodoItem = RexWidget.createWidgetClass({
  render() {
    return (
      <VBox>
        <RexWidget.Info
          fields={this.props.fields}
          data={this.props.item}
          />
      </VBox>
    );
  }
});

module.exports = TodoItem;
