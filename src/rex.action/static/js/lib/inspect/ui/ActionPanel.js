/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import * as ui from 'rex-widget/ui';
import * as stylesheet from 'rex-widget/stylesheet';
import * as layout from 'rex-widget/layout';

export default class ActionPanel extends React.Component {

  static stylesheet = stylesheet.create({
    Root: ui.Panel,
    Header: {
      Component: layout.VBox,
      padding: 5,
      fontWeight: 'bold',
    },
    Content: {
      Component: layout.VBox,
    }
  });

  render() {
    let {Root, Header, Content} = this.constructor.stylesheet;
    let {header, children, variant, onClick} = this.props;
    return (
      <Root variant={variant}>
        <Header variant={variant} onClick={onClick}>{header}</Header>
        <Content variant={variant}>{children}</Content>
      </Root>
    );
  }
}

