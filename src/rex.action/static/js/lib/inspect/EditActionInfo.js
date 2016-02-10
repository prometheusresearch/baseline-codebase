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
      border: css.border(1, '#f0ad4e'),
    },
    Header: {
      color: '#fff',
      background: '#f0ad4e',
    }
  }
});

export default function EditActionInfo({info, ...props}) {
  let type = `${info.type} ${info.entity}`;
  let title = info.title || `Edit ${info.entity}`;
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
