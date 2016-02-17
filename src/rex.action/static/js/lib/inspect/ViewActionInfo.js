/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';

import ActionInfo from './ActionInfo';

let stylesheet = override(ActionInfo.stylesheet, {
  Type: {
    color: '#fff',
    background: '#5bc0de',
  }
});

export default function ViewActionInfo({info, ...props}) {
  let type = `${info.type} ${info.entity.format()}`;
  let title = info.title || `View ${info.entity.name}`;
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
