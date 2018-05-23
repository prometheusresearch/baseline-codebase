/**
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import React from 'react';

import {InjectI18N} from 'rex-i18n';
import * as Stylesheet from 'rex-widget/stylesheet';
import {VBox, HBox} from 'rex-widget/layout';


@InjectI18N
export default class Error extends React.Component {
  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
    },

    Header: {
      Component: HBox,
      fontWeight: 'bold',
      fontSize: '2em',
      marginBottom: '10px',
    },

    Message: {
      Component: HBox,
    },
  });

  static propTypes = {
    message: React.PropTypes.string.isRequired
  };

  render() {
    let {Root, Header, Message} = this.constructor.stylesheet;
    let {title, message} = this.props;
    title = title || this._('An Error Has Occurred');

    return (
      <Root>
        <Header>{title}</Header>
        <Message>{message}</Message>
      </Root>
    );
  }
}

