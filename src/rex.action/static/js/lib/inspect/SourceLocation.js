/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react'
import * as stylesheet from 'rex-widget/stylesheet';

let defaultStylesheet = stylesheet.create({
  Root: {
    Component: 'span',
    fontFamily: 'Menlo, Monaco, monospace',
    fontSize: '70%',
    color: '#666',
  },
  Filename: 'span',
  Line: 'span',
});

export default function SourceLocation({
    location,
    stylesheet = defaultStylesheet,
    variant,
    ...props
  }) {

  let {Root, Filename, Line} = stylesheet;
  return (
    <Root {...props} variant={variant}>
      <Filename variant={variant}>{location.name}</Filename>
      {':'}
      <Line variant={variant}>{location.start.line}</Line>
    </Root>
  );
}
