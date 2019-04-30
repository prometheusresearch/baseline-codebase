/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactCreateClass = require('create-react-class');
var PropTypes = require('prop-types');

var ToolGroup = require('./ToolGroup');


var Toolbox = ReactCreateClass({
  propTypes: {
    groups: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })).isRequired,
    tools: PropTypes.arrayOf(PropTypes.func).isRequired,
    toolComponent: PropTypes.func.isRequired
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

