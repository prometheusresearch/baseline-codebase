/**
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import React from 'react';

import {InjectI18N} from 'rex-i18n';
import * as Stylesheet from 'rex-widget/stylesheet';
import {VBox, HBox} from 'rex-widget/layout';


export default InjectI18N(class ChannelChooser extends React.Component {
  static stylesheet = Stylesheet.create({
    Root: {
      Component: HBox,
      justifyContent: 'flex-end',
      marginBottom: '10px',
    },

    Label: {
      Component: HBox,
      marginRight: '10px',
    },

    SelectorContainer: {
      Component: HBox,
    },
  });

  static propTypes = {
    channels: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    initialChannel: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func
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

  onChange = (event) => {
    this.setState({
      currentChannel: event.target.value
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state.currentChannel);
      }
    });
  }

  render() {
    let {Root, Label, SelectorContainer} = this.constructor.stylesheet;

    return (
      <Root>
        <Label>{this._('Display Assessment as Rendered in:')}</Label>
        <SelectorContainer>
          <select
            value={this.state.currentChannel}
            onChange={this.onChange}>
            {this.renderChannels()}
          </select>
        </SelectorContainer>
      </Root>
    );
  }
});

