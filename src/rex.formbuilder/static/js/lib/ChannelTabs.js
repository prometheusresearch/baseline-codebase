/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react');
var cx              = React.addons.classSet;

var ChannelTabs = React.createClass({

  onChannelSelected: function (id) {
    if (this.props.onChannelSelected) {
      this.props.onChannelSelected(id);
    }
  },

  render: function() {
    var tabs = this.props.channels.map((channel) => {
      var classes = {
        'rfb-Channels-tab': true,
        'rfb-active': channel.uid === this.props.active
      };
      return (
        <a className={cx(classes)}
           onClick={this.onChannelSelected.bind(this, channel.uid)}
           key={channel.uid}>
          {channel.title}
        </a>
      );
    });
    return (
      <div className="rfb-ChannelTabs">
        <div className="rfb-Channels-tabs">
          {tabs}
        </div>
      </div>
    );
  }
});

module.exports = ChannelTabs;
