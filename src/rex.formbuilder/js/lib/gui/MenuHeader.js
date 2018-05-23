/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');


var MenuHeader = React.createClass({
  propTypes: {
    title: React.PropTypes.string,
    onClick: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      title: '',
      onClick: function () {}
    };
  },

  render: function () {
    return (
      <div
        className="rfb-menu-header">
        <div className="rfb-menu-header-title-container">
          {this.props.title &&
            <h1
              className="rfb-menu-header-title"
              onClick={this.props.onClick}>
              {this.props.title}
            </h1>
          }
        </div>
        {this.props.children &&
          <div className="rfb-menu-header-actions">
            {this.props.children}
          </div>
        }
      </div>
    );
  }
});


module.exports = MenuHeader;

