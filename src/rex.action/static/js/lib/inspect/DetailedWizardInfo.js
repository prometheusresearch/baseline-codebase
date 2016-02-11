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
  return (
    <layout.VBox left={13} marginBottom={7}>
      {instruction.element ?
        React.cloneElement(instruction.element, {onSelect, children}) :
        <ui.Panel paddingTop={7}>
          {children}
        </ui.Panel>}
    </layout.VBox>
  );
}

export default class DetailedWizardInfo extends React.Component {

  render() {
    let {info, ...props} = this.props;
    let tabList = (
      <ui.Tab id="diagram" title="Diagram">
        <layout.VBox padding={10}>
          <WizardDiagram
            level={0}
            instruction={info.wizardPath}
            onSelect={this.onSelect}
            />
        </layout.VBox>
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
    this.props.onSelect(path, info);
  }
}

