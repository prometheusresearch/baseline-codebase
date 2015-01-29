/**
 * Copyright (c) 2015, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';

var React = require('react/addons');

var _ = require('./localization').gettext;


var ChannelChooser = React.createClass({
  propTypes: {
    channels: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    initialChannel: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      currentChannel: this.props.initialChannel
    };
  },

  renderChannels: function () {
    return this.props.channels.map((channel) => {
      return (
        <option
          value={channel.uid}
          key={channel.uid}>
          {channel.title}
        </option>
      );
    });
  },

  onChange: function (event) {
    this.setState({
      currentChannel: event.target.value
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state.currentChannel);
      }
    });
  },

  render: function () {
    return (
      <div className="channel-chooser">
        <span>{_('Display Form as Rendered in:')}</span>
        <select
          value={this.state.currentChannel}
          onChange={this.onChange}>
          {this.renderChannels()}
        </select>
      </div>
    );
  }
});


module.exports = ChannelChooser;

