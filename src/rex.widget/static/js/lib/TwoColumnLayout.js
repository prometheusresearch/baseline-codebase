/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var TwoColumnLayout = React.createClass({

  propTypes: {
    sidebarWidth: React.PropTypes.number
  },

  render: function() {
    return this.transferPropsTo(
      <div className="rex-widget-TwoColumnLayout container-fluid">
        <div className="rex-widget-TwoColumnLayout__container row">
          <div className={`rex-widget-TwoColumnLayout__sidebar col-md-${this.props.sidebarWidth}`}>
            {this.props.sidebar}
          </div>
          <div className={`rex-widget-TwoColumnLayout__main col-md-${12 - this.props.sidebarWidth}`}>
            {this.props.main}
          </div>
        </div>
      </div>
    );
  },

  getDefaultProps: function() {
    return {
      sidebarWidth: 3
    };
  }
});

module.exports = TwoColumnLayout;
