/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React               = require('react/addons');
var cx                  = React.addons.classSet;
var ReactForms          = require('react-forms');
var Actions             = require('./Actions');
var ChannelTabs         = require('./ChannelTabs');
var Button              = require('../Button');

var ChannelEditor = React.createClass({

  render() {
    var {className, channels: {channels, active}, ...props} = this.props;
    var value = active && channels.getIn([active, 'configuration']);
    return (
      <div {...props} className={cx('rfb-ChannelEditor', className)}>
        <ChannelTabs
          channels={channels}
          onChannelSelected={this.onChannelSelected}
          active={active}
          />
        {value && <ReactForms.Element value={value} />}
        <div className="rfb-ChannelEditor__actions">
          <Button onClick={this.toggleChannel}>
            {this.isChannelEnabled() ? 'Disable': 'Enable'}
          </Button>
        </div>
      </div>
    );
  },

  isChannelEnabled() {
    var {active, channels} = this.props.channels;
    return active && channels.getIn([active, 'configuration']);
  },

  onChannelSelected(channelName) {
    Actions.channelActivated(channelName);
  },

  toggleChannel() {
    var {active} = this.props.channels;
    if (!active) {
      return;
    }
    if (!this.isChannelEnabled()) {
      Actions.channelEnabled(active);
    } else {
      Actions.channelDisabled(active);
    }
  }

});

module.exports = ChannelEditor;
