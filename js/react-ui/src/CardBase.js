/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import Block from './Block';

export let stylesheet = {
  Root: Block,
  Content: Block,
  Header: Block,
  Footer: Block,
};

type Props = {
  children?: React.Element<*>,
  header?: React.Element<*>,
  footer?: React.Element<*>,
  padding?: string | number,
  paddingTop?: string | number,
  paddingBottom?: string | number,
  paddingLeft?: string | number,
  paddingRight?: string | number,
  paddingV?: string | number,
  paddingH?: string | number,
  variant?: Object,
};

export default class CardBase extends React.Component<*, Props, *> {
  static stylesheet = stylesheet;

  render() {
    let {
      children,
      header,
      footer,
      padding,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      paddingV,
      paddingH,
      variant,
      ...props
    } = this.props;
    let {Root, Content, Header, Footer} = this.constructor.stylesheet;
    return (
      <Root {...props} variant={variant}>
        {header &&
          <Header variant={variant}>
            {header}
          </Header>}
        <Content
          variant={variant}
          padding={padding}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          paddingLeft={paddingLeft}
          paddingRight={paddingRight}
          paddingV={paddingV}
          paddingH={paddingH}>
          {children}
        </Content>
        {footer &&
          <Footer variant={variant}>
            {footer}
          </Footer>}
      </Root>
    );
  }
}
