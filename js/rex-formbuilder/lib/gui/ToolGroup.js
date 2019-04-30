/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactCreateClass = require('create-react-class');
var PropTypes = require('prop-types');


var ToolGroup = ReactCreateClass({
  propTypes: {
    label: PropTypes.string.isRequired,
    tools: PropTypes.arrayOf(PropTypes.func).isRequired,
    toolComponent: PropTypes.func.isRequired
  },

  buildTools: function () {
    var Component = this.props.toolComponent;
    return this.props.tools.map((tool, idx) => {
      return (
        <Component
          key={idx}
          tool={tool}
        />
      );
    });
  },

  render: function () {
    var tools = this.buildTools();
    if (!tools) {
      return null;
    }
    return (
      <div className="rfb-tool-group">
        <h3>{this.props.label}</h3>
        <div className="rfb-tool-group-container">
          {tools}
        </div>
      </div>
    );
  }
});


module.exports = ToolGroup;

