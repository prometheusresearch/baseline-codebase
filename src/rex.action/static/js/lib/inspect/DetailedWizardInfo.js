/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';
import {autobind} from 'rex-widget/lang';
import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';
import * as stylesheet from 'rex-widget/stylesheet';

import WizardInfo from './WizardInfo';
import DetailedActionInfo from './DetailedActionInfo';
import Documentation from './Documentation';
import * as Instruction from '../execution/Instruction';

let defaultStylesheet = override(DetailedActionInfo.stylesheet, {
  HeaderInfo: WizardInfo,
});

let Code = stylesheet.style('span', {
  fontFamily: 'Menlo, Monaco, monospace',
  fontSize: '70%',
});

let Label = stylesheet.style('span', {
  fontSize: '90%',
  fontWeight: 'bold',
  marginRight: 5,
});

function WizardDiagram({instruction, level, onSelect}) {
  let children = instruction.then.map((instruction, idx) =>
    <WizardDiagram
      key={instruction.action || idx}
      instruction={instruction}
      level={level + 1}
      onSelect={onSelect}
      />
  );
  if (children.length > 0) {
    children = <layout.VBox marginTop={7}>{children}</layout.VBox>
  }

  let element;
  if (Instruction.Start.is(instruction)) {
    element = (
      <ui.Panel paddingTop={7}>
        {children}
      </ui.Panel>
    );
  } else if (Instruction.Execute.is(instruction) ||
             Instruction.IncludeWizard.is(instruction)) {
    element = React.cloneElement(instruction.element, {
      onSelect: onSelect.bind(null, instruction.element),
      children,
      selectable: true,
    });
  } else if (Instruction.Replace.is(instruction)) {
    element = (
      <ui.Panel direction="row" padding={5} alignItems="center">
        <Label>Replace:</Label>{' '}<Code>{instruction.replace}</Code>
      </ui.Panel>
    );
  } else {
    element = null;
  }

  return (
    <layout.VBox flex={1} left={level > 0 ? 13 : 0} marginBottom={7}>
      {element}
    </layout.VBox>
  );
}

export default class DetailedWizardInfo extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selected: {element: null, absolutePath: null, path: null, info: null}
    };
  }

  render() {
    let {info, ...props} = this.props;
    let {selected} = this.state;
    let tabList = (
      <ui.Tab id="diagram" title="Diagram" flex={1} overflow="hidden">
        <layout.HBox justifyContent="space-between" flex={1} paddingTop={10} paddingBottom={10}>
          <layout.VBox width="50%" overflow="auto">
            <layout.VBox width="80%">
              <WizardDiagram
                level={0}
                instruction={info.wizardPath}
                onSelect={this.onSelect}
                />
            </layout.VBox>
          </layout.VBox>
          {selected.element &&
            <layout.VBox width="50%" overflow="auto">
              {React.cloneElement(selected.element, {
                onSelect: this.follow,
                selectable: true,
                children: <Documentation info={selected.info} />
              })}
            </layout.VBox>}
        </layout.HBox>
      </ui.Tab>
    );
    return (
      <DetailedActionInfo
        {...props}
        info={info}
        defaultTab="diagram"
        tabList={tabList}
        stylesheet={defaultStylesheet}
        />
    );
  }

  @autobind
  onSelect(element, path, info) {
    let absolutePath = path;
    if (path === null) {
      absolutePath = `${this.props.info.path}/@/${info.id}`;
    }
    if (info.type === 'wizard') {
      this.props.onSelect(absolutePath, info);
    } else {
      this.setState({selected: {element, path, info, absolutePath}});
    }
  }

  @autobind
  follow() {
    let {absolutePath: path, info} = this.state.selected;
    this.props.onSelect(path, info);
  }
}

