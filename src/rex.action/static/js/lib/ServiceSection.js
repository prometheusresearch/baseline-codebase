/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react');
var RexWidget                   = require('rex-widget');
var {VBox, HBox}                = RexWidget.Layout;

var ServiceSectionStyle = {

  self: {
    padding: 10,
    borderTop: '2px solid #ddd',
    paddingBottom: 20
  },
  title: {
    marginTop: 0,
    marginBottom: 10
  }
};

var ServiceSection = React.createClass({

  render() {
    var {title, children} = this.props;
    return (
      <VBox style={ServiceSectionStyle.self}>
        {title && <h5 style={ServiceSectionStyle.title}>{title}</h5>}
        {children}
      </VBox>
    );
  }
});

module.exports = ServiceSection;
