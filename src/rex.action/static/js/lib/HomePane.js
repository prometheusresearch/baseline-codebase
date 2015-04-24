/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react/addons');
var RexWidget                   = require('rex-widget/lib/modern');
var {VBox, HBox}                = RexWidget.Layout;

var HomePaneStyle = {
  self: {
    padding: 10
  }
};

var HomePane = React.createClass({

  render() {
    return (
      <VBox style={HomePaneStyle.self}>
        <h4>
          Home
        </h4>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      width: 480,
      activityName: 'Home',
      activityIcon: 'home'
    };
  }
});

module.exports = HomePane;
