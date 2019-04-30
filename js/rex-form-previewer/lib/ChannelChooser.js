/**
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import React from 'react';
import PropTypes from 'prop-types';

import {InjectI18N} from 'rex-i18n';
import {VBox, HBox} from '@prometheusresearch/react-ui';


export default InjectI18N(class ChannelChooser extends React.Component {
  static propTypes = {
    channels: PropTypes.arrayOf(PropTypes.object).isRequired,
    initialChannel: PropTypes.string.isRequired,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      currentChannel: props.initialChannel
    };
  }

  renderChannels() {
    return this.props.channels.map((channel) => {
      return (
        <option
          value={channel.uid}
          key={channel.uid}>
          {channel.title}
        </option>
      );
    });
  }

  onChange(event) {
    this.setState({
      currentChannel: event.target.value
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state.currentChannel);
      }
    });
  }

  render() {
    return (
      <HBox marginLeft='20px'>
        <HBox marginRight='10px'>{this._('Display Assessment as Rendered in:')}</HBox>
        <HBox>
          <select
            value={this.state.currentChannel}
            onChange={this.onChange.bind(this)}>
            {this.renderChannels()}
          </select>
        </HBox>
      </HBox>
    );
  }
});
