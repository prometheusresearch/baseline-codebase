/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';
import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';

import WizardInfo from './WizardInfo';
import DetailedActionInfo from './DetailedActionInfo';

let stylesheet = override(DetailedActionInfo.stylesheet, {
  HeaderInfo: WizardInfo,
});

function WizardDiagram({instruction, level, onSelect}) {
  return (
    <layout.VBox left={10 * (level - 1)}>
      {instruction.element &&
        <layout.VBox marginBottom={5}>
          {React.cloneElement(instruction.element, {onSelect})}
        </layout.VBox>}
      {instruction.then.map((instruction, idx) =>
        <WizardDiagram
          key={instruction.action || idx}
          instruction={instruction}
          level={level + 1}
          onSelect={onSelect}
          />)}
    </layout.VBox>
  );
}

export default function DetailedWizardInfo({info, onSelect, ...props}) {
  let tabList = (
    <ui.Tab id="diagram" title="Diagram">
      <layout.VBox padding={10}>
        <WizardDiagram
          level={0}
          instruction={info.wizardPath}
          onSelect={onSelect}
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

