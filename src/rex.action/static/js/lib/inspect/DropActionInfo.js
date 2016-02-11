/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';
import * as css from 'rex-widget/css';

import ActionInfo from './ActionInfo';

let stylesheet = override(ActionInfo.stylesheet, {
  Type: {
    color: '#fff',
    background: '#d9534f',
  }
});

export default function DropActionInfo({info, ...props}) {
  let type = `${info.type}`;
  let title = info.title || `Drop`;
  return (
    <ActionInfo
      {...props}
      info={info}
      type={type}
      title={title}
      stylesheet={stylesheet}
      />
  );
}
