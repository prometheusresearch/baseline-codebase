/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import * as layout from 'rex-widget/layout';
import * as stylesheet from 'rex-widget/stylesheet';
import * as css from 'rex-widget/css';
import * as ui from 'rex-widget/ui';

let _Section = stylesheet.style(layout.VBox, {
  marginBottom: 100
});

let _SectionTitle = stylesheet.style('h2', {
  fontSize: '16pt',
  fontWeight: 900,
  margin: 0,
  marginBottom: 25,
});

export function Section({title, children, ...props}) {
  return (
    <_Section {...props}>
      {title && <_SectionTitle>{title}</_SectionTitle>}
      {children}
    </_Section>
  );
}

let _SubSection = stylesheet.style(layout.VBox, {
  marginBottom: 50
});

let _SubSectionTitle = stylesheet.style('h3', {
  fontSize: '12pt',
  fontWeight: 700,
  margin: 0,
  marginBottom: 5,
});

export function SubSection({title, children, ...props}) {
  return (
    <_SubSection {...props}>
      {title && <_SubSectionTitle>{title}</_SubSectionTitle>}
      {children}
    </_SubSection>
  );
}

let _CodeBlock = stylesheet.style('div', {
  fontFamily: 'Menlo, Monaco, monospace',
  fontSize: '80%',
  background: '#f5f5f5',
  color: '#555',
  lineHeight: '1.4em',
  padding: 15,
  whiteSpace: 'pre',
  borderTop: css.border(1, '#ddd'),
  borderBottom: css.border(1, '#ddd'),
  noBorder: {
    border: css.none,
  }
});

export function CodeBlock({children, noBorder}) {
  let lines = children.split('\n').filter(Boolean);
  if (lines.length > 0) {
    let firstLine = lines[0] || '';
    let numSpaces = 0;
    for (let i = 0; i < firstLine.length; i++) {
      if (firstLine[i] === ' ') {
        numSpaces = i;
      } else {
        break;
      }
    }
    lines = lines.map(line => line.slice(numSpaces + 1));
  }
  return (
    <_CodeBlock variant={{noBorder}}>
      {lines.join('\n').trim()}
    </_CodeBlock>
  );
}

let _Code = stylesheet.style('code', {
  fontFamily: 'Menlo, Monaco, monospace',
  fontSize: '85%',
  color: css.rgb(116),
  whiteSpace: 'pre',
  padding: '2px 4px',
});

export function Code({children}) {
  return (
    <_Code>
      {children}
    </_Code>
  );
}

let _CodeDemo = stylesheet.style(layout.VBox, {
  borderBottom: css.border(1, '#ddd'),
});

export function CodeDemo({code, secondary, children, ...props}) {
  let Panel = secondary ? ui.SecondaryPanel : ui.Panel;
  return (
    <_CodeDemo {...props}>
      <ui.Panel>
        <CodeBlock noBorder>{code}</CodeBlock>
      </ui.Panel>
      <Panel padding={20}>
        <div>{children}</div>
      </Panel>
    </_CodeDemo>
  );
}
