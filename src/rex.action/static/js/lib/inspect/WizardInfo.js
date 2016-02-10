/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';
import * as css from 'rex-widget/css';

import ActionInfo from './ActionInfo';

let stylesheet = override(ActionInfo.stylesheet, {
  Root: {
    Root: {
      border: css.border(1, '#337ab7'),
    },
    Header: {
      color: '#fff',
      background: '#337ab7',
    }
  }
});

export default function WizardInfo({info, ...props}) {
  let title = info.title || 'Untitled Wizard';
  return (
    <ActionInfo
      {...props}
      info={info}
      title={title}
      stylesheet={stylesheet}
      />
  );
}
