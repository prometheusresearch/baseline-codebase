/**
 * @jsx React.DOM
 */
'use strict';

var React  = require('react');
var Button = require('./Button');
var ButtonGroup = require('./ButtonGroup');

var LoadingScreen = React.createClass({

  getDefaultProps: function () {
    return {
      error: null
    };
  },

  render: function() {
    return (
      <div className="rfb-centered">
        <div>
          {this.props.error ?
            <span className="text-danger">{this.props.error}</span>
             :
            <span className="rfb-loading">
              <span className={'glyphicon glyphicon-refresh ' +
                               'glyphicon-refresh-animate'}></span>
              Loading...
            </span>
          }
        </div>
      </div>
    );
  }
});

module.exports = LoadingScreen;
