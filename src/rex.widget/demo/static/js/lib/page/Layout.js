/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import * as Layout from 'rex-widget/layout';
import * as Stylesheet from 'rex-widget/stylesheet';
import {CodeBlock, CodeDemo, Code, Section} from '../Content';

let Box = Stylesheet.apply(Layout.VBox, {
  background: '#ddd',
  width: 50,
  height: 50,
  margin: 10
});

export default function LayoutPage() {
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
        <Layout.HBox>
          <CodeDemo
            flex={1}
            marginRight={10}
            code={`<VBox>...</VBox>`}>
            <Layout.VBox>
              <Box />
              <Box />
              <Box />
            </Layout.VBox>
          </CodeDemo>
          <CodeDemo
            flex={1}
            code={`<HBox>...</HBox>`}>
            <Layout.HBox>
              <Box />
              <Box />
              <Box />
            </Layout.HBox>
          </CodeDemo>
        </Layout.HBox>
      </Section>
      <Section>
        <p>
          All layout related style properties can be set as props on components
          (<Code>width</Code>, <Code>height</Code>, <Code>flex</Code>, ...):
        </p>
        <Layout.HBox>
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
            <Layout.VBox height={200}>
              <Box flex={1} />
              <Box flex={2} />
              <Box flex={1} />
            </Layout.VBox>
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
            <Layout.HBox>
              <Box flex={1} />
              <Box flex={2} />
              <Box flex={1} />
            </Layout.HBox>
          </CodeDemo>
        </Layout.HBox>
      </Section>
      <Section>
        <p>
          Alignment is easy with Flex Box:
        </p>
        <Layout.HBox>
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
            <Layout.VBox height={200} alignItems="center">
              <Box alignSelf="flex-start" />
              <Box />
              <Box alignSelf="flex-end" />
            </Layout.VBox>
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
            <Layout.HBox justifyContent="center">
              <Box />
              <Box />
              <Box />
            </Layout.HBox>
          </CodeDemo>
        </Layout.HBox>
      </Section>
    </div>
  );
}
