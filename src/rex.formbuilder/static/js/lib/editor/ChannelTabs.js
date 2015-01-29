/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React           = require('react');
var cx              = React.addons.classSet;

var ChannelTabs = React.createClass({

  render() {
    var tabs = this.props.channels.map(channel => {
      var uid = channel.uid;
      var className = cx({
        'rfb-ChannelTabs__tab': true,
        'rfb-active': uid === this.props.active
      });
      return (
        <a
          className={className}
          onClick={this.onClick.bind(this, uid)}
          key={uid}>
          {channel.title}
        </a>
      );
    });
    return (
      <div className="rfb-ChannelTabs">
        <div className="rfb-ChannelTabs__tabs">
          {tabs}
        </div>
      </div>
    );
  },

  getDefaultProps() {
    return {
      channels: [],
      onChannelSelected: function () {}
    };
  },

  onClick(uid) {
    this.props.onChannelSelected(uid);
  }

});

module.exports = ChannelTabs;
