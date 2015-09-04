/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var ToolGroup = require('./ToolGroup');


var Toolbox = React.createClass({
  propTypes: {
    groups: React.PropTypes.arrayOf(React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired
    })).isRequired,
    tools: React.PropTypes.arrayOf(React.PropTypes.func).isRequired,
    toolComponent: React.PropTypes.func.isRequired
  },

  buildGroups: function () {
    return this.props.groups.map((group) => {
      var tools = this.props.tools.filter((tool) => {
        return (group.id === tool.getType());
      });

      return (
        <ToolGroup
          key={group.id}
          label={group.label}
          tools={tools}
          toolComponent={this.props.toolComponent}
          />
      );
    });
  },

  render: function () {
    var groups = this.buildGroups();

    return (
      <div className="rfb-toolbox">
        {groups}
      </div>
    );
  }
});


module.exports = Toolbox;

