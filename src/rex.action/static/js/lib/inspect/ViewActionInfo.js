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
      border: css.border(1, '#5bc0de'),
    },
    Header: {
      color: '#fff',
      background: '#5bc0de',
    }
  }
});

export default function ViewActionInfo({info, ...props}) {
  let type = `${info.type} ${info.entity}`;
  let title = info.title || `View ${info.entity}`;
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
