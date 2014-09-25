/**
 * @jsx React.DOM
 */
'use strict';

var React            = require('react');
var loadingIndicator = require('../img/loading-indicator.gif');

var LoadingIndicator = React.createClass({

  render: function() {
    return this.transferPropsTo(
      <div className="rw-LoadingIndicator">
        <img src={loadingIndicator} />
      </div>
    );
  }
});

module.exports = LoadingIndicator;
