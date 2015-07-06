/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React     = require('react');
var RexWidget = require('rex-widget');
var {VBox}    = RexWidget.Layout;

var DemoPageStyle = {
  self: {
    width: 600,
    margin: '0 auto'
  },
  title: {
    marginBottom: 25
  },
  children: {
  }
};

/**
 * Page for feature demos.
 */
var DemoPage = RexWidget.createWidgetClass({

  render() {
    var {title, children, style} = this.props;
    return (
      <VBox size={1} style={{...DemoPageStyle.self, ...style}}>
        <VBox style={DemoPageStyle.title}>
          <h1>{title}</h1>
        </VBox>
        <VBox style={DemoPageStyle.children}>
          {children}
        </VBox>
      </VBox>
    );
  }
});

module.exports = DemoPage;
