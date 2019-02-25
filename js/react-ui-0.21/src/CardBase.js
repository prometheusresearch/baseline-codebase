/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import Block from './Block';

export default function Card({
  children,
  header,
  footer,
  stylesheet,
  padding,
  paddingTop, paddingBottom, paddingLeft, paddingRight,
  paddingV, paddingH,
  variant,
  ...props
}) {
  return (
    <stylesheet.Root {...props} variant={variant}>
      {header &&
        <stylesheet.Header variant={variant}>
          {header}
        </stylesheet.Header>}
      <stylesheet.Content
        variant={variant}
        padding={padding}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        paddingLeft={paddingLeft}
        paddingRight={paddingRight}
        paddingV={paddingV}
        paddingH={paddingH}>
        {children}
      </stylesheet.Content>
      {footer &&
        <stylesheet.Footer variant={variant}>
          {footer}
        </stylesheet.Footer>}
    </stylesheet.Root>
  );
}

Card.defaultProps = {
  stylesheet: {
    Root: Block,
    Content: Block,
    Header: Block,
    Footer: Block,
  }
};
