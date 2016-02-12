/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';
import {autobind} from 'rex-widget/lang';
import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';

import WizardInfo from './WizardInfo';
import DetailedActionInfo from './DetailedActionInfo';
import Documentation from './Documentation';

let stylesheet = override(DetailedActionInfo.stylesheet, {
  HeaderInfo: WizardInfo,
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
  return (
    <layout.VBox flex={1} left={level > 0 ? 13 : 0} marginBottom={7}>
      {instruction.element ?
        React.cloneElement(instruction.element, {
          onSelect,
          children,
          selectable: true,
        }) :
        <ui.Panel paddingTop={7}>
          {children}
        </ui.Panel>}
    </layout.VBox>
  );
}

export default class DetailedWizardInfo extends React.Component {

  constructor(props) {
    super(props);
    this.state = {selected: {path: null, info: null}};
  }

  render() {
    let {info, ...props} = this.props;
    let {selected} = this.state;
    let tabList = (
      <ui.Tab id="diagram" title="Diagram" flex={1} overflow="hidden">
        <layout.HBox justifyContent="space-between" flex={1}>
          <layout.VBox paddingTop={10} paddingBottom={10} width="50%" overflow="auto">
            <layout.VBox width="80%">
              <WizardDiagram
                level={0}
                instruction={info.wizardPath}
                onSelect={this.onSelect}
                />
            </layout.VBox>
          </layout.VBox>
          {selected.info &&
            <layout.VBox width="50%">
              <Documentation info={selected.info} />
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
        stylesheet={stylesheet}
        />
    );
  }

  @autobind
  onSelect(path, info) {
    if (path === null) {
      path = `${this.props.info.path}/@/${info.id}`;
    }
    this.setState({selected: {path, info}});
  }
}

