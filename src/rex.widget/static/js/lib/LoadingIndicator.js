/**
 * @jsx React.DOM
 */
'use strict';

var React            = require('react');
var loadingIndicator = require('../img/loading-indicator.gif');

var LoadingIndicator = React.createClass({

  render: function() {
    return (
      <div {...this.props} className="rw-LoadingIndicator">
        <img src={__PUBLIC_PATH__ + loadingIndicator} />
      </div>
    );
  }
});

module.exports = LoadingIndicator;
