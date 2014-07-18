/**
 * @jsx React.DOM
 */
'use strict';

var React            = require('react');
var LoadingIndicator = require('./LoadingIndicator');

var Preloader = React.createClass({

  render: function() {
    return (
      <div className="rex-widget-Preloader">
        <LoadingIndicator /> 
        <div className="rex-widget-Preloader__caption">{this.props.caption}</div>
      </div>
    );
  },

  getDefaultProps: function() {
    return {caption: 'Loading'};
  }
});

module.exports = Preloader;
