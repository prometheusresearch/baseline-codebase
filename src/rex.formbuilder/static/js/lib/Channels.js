/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react');
var cx          = React.addons.classSet;
var ChannelForm = require('./ChannelForm');

var Channels = React.createClass({

  getInitialState: function () {
    var channels = this.props.channels;
    return {active: channels.length ? channels[0].uid : null};
  },

  setActive: function (id) {
    this.setState({active: id});
    // console.log('arguments', arguments, 'this', this, 'idx', idx);
  },

  render: function() {
    var tabs = this.props.channels.map((channel) => {
      var classes = {
        'rfb-Channels-tab': true,
        'rfb-active': channel.uid === this.state.active
      };
      return (
        <a className={cx(classes)}
           onClick={this.setActive.bind(this, channel.uid)}>
          {channel.title}
        </a>
      );
    });
    var channels = this.props.channels.map((channel) => {
      var style = {
        display: channel.uid === this.state.active ? null : 'none'
      };
      return (
        <div style={style}>
          <ChannelForm />
        </div>
      );
    });
    return (
      <div className="rfb-Channels">
        <div className="rfb-Channels-head">
          <div className="rfb-Channels-tabs">
            {tabs}
          </div>
        </div>
        <div className="rfb-Channels-body">
          {channels}
        </div>
      </div>
    );
  }
});

module.exports = Channels;
