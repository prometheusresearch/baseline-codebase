/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react'

import {autobind} from 'rex-widget/lang';
import * as stylesheet from 'rex-widget/stylesheet';
import * as layout from 'rex-widget/layout';

let defaultStylesheet = stylesheet.create({
  Root: {
    padding: 10,
    fontSize: '80%',
  },
  Code: {
    Component: 'span',
    fontFamily: 'Menlo, Monaco, monospace',
    whiteSpace: 'pre',
    fontSize: '90%',
  },
  CodeDeemphasized: {
    Component: 'span',
    fontFamily: 'Menlo, Monaco, monospace',
    whiteSpace: 'pre',
    fontSize: '90%',
    color: '#999',
  },
  SectionHeader: {
    fontWeight: 'bold',
    fontSize: '110%',
    marginBottom: 10,
  }
});

export default function Documentation({
    info: {doc, contextTypes},
    stylesheet = defaultStylesheet}) {
  let {Root, Code, CodeDeemphasized, SectionHeader} = stylesheet;
  let inputKeys = Object.keys(contextTypes.input.rows);
  let outputKeys = Object.keys(contextTypes.output.rows);
  return (
    <Root>
      <layout.VBox marginBottom={10}>
        <SectionHeader>Context</SectionHeader>
        <layout.VBox>
          <p>This action <strong>requires</strong> the following from context:</p>
          <layout.VBox padding={5}>
            {inputKeys.length > 0 ?
              inputKeys.map(key =>
                <Code key={key}>
                  {key}: {contextTypes.input.rows[key].type.format()}
                </Code>) :
              <CodeDeemphasized>no requirements</CodeDeemphasized>}
          </layout.VBox>
        </layout.VBox>
        <layout.VBox>
          <p>This action <strong>adds</strong> the following to context:</p>
          <layout.VBox padding={5}>
            {outputKeys.length > 0 ?
              outputKeys.map(key =>
                <Code key={key}>
                  {key}: {contextTypes.output.rows[key].type.format()}
                </Code>) :
              <CodeDeemphasized>nothing</CodeDeemphasized>}
          </layout.VBox>
        </layout.VBox>
      </layout.VBox>
      <layout.VBox>
        <SectionHeader>Documentation</SectionHeader>
        {doc || 'No documentation provided'}
      </layout.VBox>
    </Root>
  );
}
