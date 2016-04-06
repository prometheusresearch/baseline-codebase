/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import * as layout from 'rex-widget/layout';
import * as stylesheet from 'rex-widget/stylesheet';
import {CodeBlock, CodeDemo, Code, Section} from '../Content';

let Box = stylesheet.style(layout.VBox, {
  background: '#ddd',
  width: 50,
  height: 50,
  margin: 10
});

export default function layoutPage() {
  return (
    <div>
      <Section marginTop={100}>
        <p>
          Rex Widget provides layout primitives based on Flex Box specification.
        </p>
        <CodeBlock>{`import {VBox, HBox} from 'rex-widget/layout'`}</CodeBlock>
      </Section>
      <Section>
        <p>
          <Code>VBox</Code> renders its children vertically and <Code>HBox</Code> &mdash;
          horizontally:
        </p>
        <layout.HBox>
          <CodeDemo
            flex={1}
            marginRight={10}
            code={`<VBox>...</VBox>`}>
            <layout.VBox>
              <Box />
              <Box />
              <Box />
            </layout.VBox>
          </CodeDemo>
          <CodeDemo
            flex={1}
            code={`<HBox>...</HBox>`}>
            <layout.HBox>
              <Box />
              <Box />
              <Box />
            </layout.HBox>
          </CodeDemo>
        </layout.HBox>
      </Section>
      <Section>
        <p>
          All layout related style properties can be set as props on components
          (<Code>width</Code>, <Code>height</Code>, <Code>flex</Code>, ...):
        </p>
        <layout.HBox>
          <CodeDemo
            flex={1}
            marginRight={10}
            code={`
              <VBox>
                <VBox flex={1} />
                <VBox flex={2} />
                <VBox flex={1} />
              <VBox>
            `}>
            <layout.VBox height={200}>
              <Box flex={1} />
              <Box flex={2} />
              <Box flex={1} />
            </layout.VBox>
          </CodeDemo>
          <CodeDemo
            flex={1}
            code={`
              <HBox>
                <VBox flex={1} />
                <VBox flex={2} />
                <VBox flex={1} />
              <HBox>
            `}>
            <layout.HBox>
              <Box flex={1} />
              <Box flex={2} />
              <Box flex={1} />
            </layout.HBox>
          </CodeDemo>
        </layout.HBox>
      </Section>
      <Section>
        <p>
          Alignment is easy with Flex Box:
        </p>
        <layout.HBox>
          <CodeDemo
            flex={1}
            marginRight={10}
            code={`
              <VBox alignItems="center">
                <VBox alignSelf="flex-start" />
                <VBox />
                <VBox alignSelf="flex-end" />
              <VBox>
            `}>
            <layout.VBox height={200} alignItems="center">
              <Box alignSelf="flex-start" />
              <Box />
              <Box alignSelf="flex-end" />
            </layout.VBox>
          </CodeDemo>
          <CodeDemo
            flex={1}
            code={`
              <HBox>
                <VBox flex={1} />
                <VBox flex={2} />
                <VBox flex={1} />
              <HBox>
            `}>
            <layout.HBox justifyContent="center">
              <Box />
              <Box />
              <Box />
            </layout.HBox>
          </CodeDemo>
        </layout.HBox>
      </Section>
    </div>
  );
}
