/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';
import {CodeBlock, CodeDemo, Code, Section, SubSection} from '../Content';

function RegularButtonDemo() {
  return (
    <SubSection title="<Button />">
      <p>
        <Code children="<Button />" /> component provides a styleable button
        with several UI variants:
      </p>
      <CodeDemo code={`
        <ui.Button size="small">Button</ui.Button>
        <ui.Button>Button</ui.Button>
        <ui.Button size="large">Button</ui.Button>
        `}>
        <div style={{marginBottom: 5}}>
          <ui.Button size="small">Button</ui.Button>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.Button>Button</ui.Button>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.Button size="large">Button</ui.Button>
        </div>
      </CodeDemo>
      <p>
        Disabled state:
      </p>
      <CodeDemo code={`
        <ui.Button disabled>Button</ui.Button>
        `}>
        <ui.Button disabled>Disabled</ui.Button>
      </CodeDemo>
    </SubSection>
  );
}

function SuccessButtonDemo() {
  return (
    <SubSection title="<SuccessButton />">
      <p>
        There's <Code children="<SuccessButton />" /> variant:
      </p>
      <CodeDemo code={`
        <ui.SuccessButton size="small">Submit</ui.SuccessButton>
        <ui.SuccessButton>Submit</ui.SuccessButton>
        <ui.SuccessButton size="large">Submit</ui.SuccessButton>
        `}>
        <div style={{marginBottom: 5}}>
          <ui.SuccessButton size="small">Submit</ui.SuccessButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.SuccessButton>Submit</ui.SuccessButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.SuccessButton size="large">Submit</ui.SuccessButton>
        </div>
      </CodeDemo>
      <p>
        With <Code>disabled</Code> variant as well:
      </p>
      <CodeDemo code={`
        <ui.SuccessButton disabled>Submit</ui.SuccessButton>
        `}>
        <ui.SuccessButton disabled>Submit</ui.SuccessButton>
      </CodeDemo>
    </SubSection>
  );
}

function DangerButtonDemo() {
  return (
    <SubSection title="<DangerButton />">
      <p>
        There's <Code children="<DangerButton />" /> variant:
      </p>
      <CodeDemo code={`
        <ui.DangerButton size="small">Remove</ui.DangerButton>
        <ui.DangerButton>Remove</ui.DangerButton>
        <ui.DangerButton size="large">Remove</ui.DangerButton>
        `}>
        <div style={{marginBottom: 5}}>
          <ui.DangerButton size="small">Remove</ui.DangerButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.DangerButton>Remove</ui.DangerButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.DangerButton size="large">Remove</ui.DangerButton>
        </div>
      </CodeDemo>
      <p>
        With <Code>disabled</Code> variant as well:
      </p>
      <CodeDemo code={`
        <ui.DangerButton disabled>Remove</ui.DangerButton>
        `}>
        <ui.DangerButton disabled>Remove</ui.DangerButton>
      </CodeDemo>
    </SubSection>
  );
}

function FlatButtonDemo() {
  return (
    <SubSection title="<FlatButton />">
      <p>
        There's <Code children="<FlatButton />" /> variant:
      </p>
      <CodeDemo code={`
        <ui.FlatButton size="small">Action</ui.FlatButton>
        <ui.FlatButton>Action</ui.FlatButton>
        <ui.FlatButton size="large">Action</ui.FlatButton>
        `}>
        <div style={{marginBottom: 5}}>
          <ui.FlatButton size="small">Action</ui.FlatButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.FlatButton>Action</ui.FlatButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.FlatButton size="large">Action</ui.FlatButton>
        </div>
      </CodeDemo>
      <p>
        With <Code>disabled</Code> variant as well:
      </p>
      <CodeDemo code={`
        <ui.FlatButton disabled>Action</ui.FlatButton>
        `}>
        <ui.FlatButton disabled>Action</ui.FlatButton>
      </CodeDemo>
    </SubSection>
  );
}

function QuietButtonDemo() {
  return (
    <SubSection title="<QuietButton />">
      <p>
        There's <Code children="<QuietButton />" /> variant:
      </p>
      <CodeDemo code={`
        <ui.QuietButton size="small">Mute</ui.QuietButton>
        <ui.QuietButton>Mute</ui.QuietButton>
        <ui.QuietButton size="large">Mute</ui.QuietButton>
        `}>
        <div style={{marginBottom: 5}}>
          <ui.QuietButton size="small">Mute</ui.QuietButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.QuietButton>Mute</ui.QuietButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.QuietButton size="large">Mute</ui.QuietButton>
        </div>
      </CodeDemo>
      <p>
        With <Code>disabled</Code> variant as well:
      </p>
      <CodeDemo code={`
        <ui.QuietButton disabled>Mute</ui.QuietButton>
        `}>
        <ui.QuietButton disabled>Mute</ui.QuietButton>
      </CodeDemo>
    </SubSection>
  );
}

function SecondaryButton() {
  return (
    <SubSection title="<SecondaryButton />">
      <p>
        There's <Code children="<SecondaryButton />" /> variant:
      </p>
      <CodeDemo secondary code={`
        <ui.SecondaryButton size="small">Action</ui.SecondaryButton>
        <ui.SecondaryButton>Action</ui.SecondaryButton>
        <ui.SecondaryButton size="large">Action</ui.SecondaryButton>
        `}>
        <div style={{marginBottom: 5}}>
          <ui.SecondaryButton size="small">Action</ui.SecondaryButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.SecondaryButton>Action</ui.SecondaryButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.SecondaryButton size="large">Action</ui.SecondaryButton>
        </div>
      </CodeDemo>
      <p>
        With <Code>disabled</Code> variant as well:
      </p>
      <CodeDemo secondary code={`
        <ui.SecondaryButton disabled>Action</ui.SecondaryButton>
        `}>
        <ui.SecondaryButton disabled>Action</ui.SecondaryButton>
      </CodeDemo>
    </SubSection>
  );
}

function SecondaryQuietButton() {
  return (
    <SubSection title="<SecondaryQuietButton />">
      <p>
        There's <Code children="<SecondaryQuietButton />" /> variant:
      </p>
      <CodeDemo secondary code={`
        <ui.SecondaryQuietButton size="small">Mute</ui.SecondaryQuietButton>
        <ui.SecondaryQuietButton>Mute</ui.SecondaryQuietButton>
        <ui.SecondaryQuietButton size="large">Mute</ui.SecondaryQuietButton>
        `}>
        <div style={{marginBottom: 5}}>
          <ui.SecondaryQuietButton size="small">Mute</ui.SecondaryQuietButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.SecondaryQuietButton>Mute</ui.SecondaryQuietButton>
        </div>
        <div style={{marginBottom: 5}}>
          <ui.SecondaryQuietButton size="large">Mute</ui.SecondaryQuietButton>
        </div>
      </CodeDemo>
      <p>
        With <Code>disabled</Code> variant as well:
      </p>
      <CodeDemo secondary code={`
        <ui.SecondaryQuietButton disabled>Mute</ui.SecondaryQuietButton>
        `}>
        <ui.SecondaryQuietButton disabled>Mute</ui.SecondaryQuietButton>
      </CodeDemo>
    </SubSection>
  );
}

function GroupingButtonDemo() {
  return (
    <SubSection title="Grouping and embedding buttons">
      <p>
        Buttons can be rendered together to appear as a group:
      </p>
      <CodeDemo code={`
        <layout.HBox>
          <ui.Button attach={{right: true}}>Left</ui.Button>
          <ui.Button>Middle</ui.Button>
          <ui.Button attach={{left: true}}>Right</ui.Button>
        </layout.HBox>
        `}>
        <layout.HBox>
          <ui.Button attach={{right: true}}>Left</ui.Button>
          <ui.Button>Middle</ui.Button>
          <ui.Button attach={{left: true}}>Right</ui.Button>
        </layout.HBox>
      </CodeDemo>
      <p>
        Also vertically:
      </p>
      <CodeDemo code={`
        <layout.VBox>
          <ui.Button attach={{bottom: true}}>Top</ui.Button>
          <ui.Button>Middle</ui.Button>
          <ui.Button attach={{top: true}}>Bottom</ui.Button>
        </layout.VBox>
        `}>
        <layout.VBox width={100}>
          <ui.Button attach={{bottom: true}}>Top</ui.Button>
          <ui.Button>Middle</ui.Button>
          <ui.Button attach={{top: true}}>Bottom</ui.Button>
        </layout.VBox>
      </CodeDemo>

      <p>
        Embed in <Code children="<Panel />" />:
      </p>
      <CodeDemo code={`
        <ui.Panel>
          <layout.VBox padding={10}>
            <ui.Label>Menu</ui.Label>
          </layout.VBox>
          <ui.Divider />
          <ui.QuietButton attach={{left: true, right: true}}>Button</ui.QuietButton>
          <ui.QuietButton attach={{left: true, right: true}}>Button</ui.QuietButton>
          <ui.QuietButton attach={{left: true, right: true}}>Button</ui.QuietButton>
          <ui.QuietButton attach={{left: true, right: true}}>Button</ui.QuietButton>
        </ui.Panel>
        `}>
        <ui.Panel width={150}>
          <layout.VBox padding={10}>
            <ui.Label>Menu</ui.Label>
          </layout.VBox>
          <ui.Divider />
          <ui.QuietButton attach={{left: true, right: true}}>Button</ui.QuietButton>
          <ui.QuietButton attach={{left: true, right: true}}>Button</ui.QuietButton>
          <ui.QuietButton attach={{left: true, right: true}}>Button</ui.QuietButton>
          <ui.QuietButton attach={{left: true, right: true}}>Button</ui.QuietButton>
        </ui.Panel>
      </CodeDemo>
    </SubSection>
  );
}

export default function UIPage() {
  return (
    <div>
      <Section marginTop={100}>
        <p>
          Rex Widget has a library of UI components which can be styled and
          reused across multiple apps.
        </p>
        <CodeBlock>{`import * as ui from 'rex-widget/ui'`}</CodeBlock>
      </Section>

      <Section title="<Button />">
        <RegularButtonDemo />
        <FlatButtonDemo />
        <QuietButtonDemo />
        <SecondaryButton />
        <SecondaryQuietButton />
        <SuccessButtonDemo />
        <DangerButtonDemo />
        <GroupingButtonDemo />
      </Section>


      <Section title="<Panel />">
        <p>
          <Code children="<Panel />" /> component extends
          <Code children="<VBox />" /> with appearance style:
        </p>
        <CodeDemo
          secondary
          code={`
            <ui.Panel padding={10}>
              Some content.
            </ui.Panel>
          `}>
          <ui.Panel padding={20}>
            Some content.
          </ui.Panel>
        </CodeDemo>

        <p>
          <Code children="<Panel />" /> easily composes with other widgets:
        </p>
        <CodeDemo
          secondary
          code={`
            <ui.Panel>
              <layout.VBox flex={1} padding={10}>
                <div>Question?</div>
              </layout.VBox>
              <layout.HBox padding={10} justifyContent="flex-end">
                <layout.VBox marginRight={5}>
                  <ui.SuccessButton>OK</ui.SuccessButton>
                </layout.VBox>
                <layout.VBox marginRight={5}>
                  <ui.Button>Cancel</ui.Button>
                </layout.VBox>
              </layout.HBox>
            </ui.Panel>
          `}>
          <ui.Panel maxWidth="50%" minHeight="150px">
            <layout.VBox flex={1} padding={10}>
              <div>Question?</div>
            </layout.VBox>
            <layout.HBox padding={10} justifyContent="flex-end">
              <layout.VBox marginRight={5}>
                <ui.SuccessButton>OK</ui.SuccessButton>
              </layout.VBox>
              <layout.VBox marginRight={5}>
                <ui.DangerButton>Cancel</ui.DangerButton>
              </layout.VBox>
              <layout.VBox marginRight={5}>
                <ui.Button>Hm...</ui.Button>
              </layout.VBox>
            </layout.HBox>
          </ui.Panel>
        </CodeDemo>

        <p>
          <Code children="<SecondaryPanel />" /> is used to mark auxiliary areas
          in an application: </p>
        <CodeDemo
          code={`
            <ui.SecondaryPanel padding={10}>
              <div>Question?</div>
            </ui.Panel>
          `}>
          <ui.SecondaryPanel maxWidth="50%" minHeight="150px" padding={10}>
            <div>Question?</div>
          </ui.SecondaryPanel>
        </CodeDemo>

      </Section>

      <Section title="<TabList />">
        <p>
          <Code>TabList/Tab</Code> components can be used to implement tabbed
          navigation:
        </p>
        <CodeDemo
          code={`
            <ui.TabList selected="contacts" onSelected={...}>
              <ui.Tab id="demographics" title="Demographics">...</ui.Tab>
              <ui.Tab id="contacts" title="Contacts">...</ui.Tab>
              <ui.Tab id="todo" title="Todo">...</ui.Tab>
              <ui.Tab id="appointments" title="Appointments">...</ui.Tab>
            </ui.TabList>
          `}>
          <ui.TabList selected="contacts">
            <ui.Tab id="demographics" title="Demographics" />
            <ui.Tab id="contacts" title="Contacts" />
            <ui.Tab id="todo" title="Todo" />
            <ui.Tab id="appointments" title="Appointments" />
          </ui.TabList>
        </CodeDemo>
      </Section>

      <Section title="<PillList />">
        <p>
          <Code>PillList/Pill</Code> components are similar to
          <Code>TabList/Tab</Code> above but have a different appearance:
        </p>
        <CodeDemo
          code={`
            <ui.PillList selected="contacts" onSelected={...}>
              <ui.Pill id="demographics" title="Demographics">...</ui.Pill>
              <ui.Pill id="contacts" title="Contacts">...</ui.Pill>
              <ui.Pill id="todo" title="Todo">...</ui.Pill>
              <ui.Pill id="appointments" title="Appointments">...</ui.Pill>
            </ui.PillList>
          `}>
          <ui.PillList selected="contacts">
            <ui.Pill id="demographics" title="Demographics" />
            <ui.Pill id="contacts" title="Contacts" />
            <ui.Pill id="todo" title="Todo" />
            <ui.Pill id="appointments" title="Appointments" />
          </ui.PillList>
        </CodeDemo>
      </Section>

      <Section title="<Tooltip />">
      </Section>

      <Section title="<Select />">
      </Section>

      <Section title="<TextInput />">
      </Section>

      <Section title="<Divider />">
      </Section>

      <Section title="<Label />">
      </Section>

      <Section title="<Loader />">
      </Section>
    </div>
  );
}

