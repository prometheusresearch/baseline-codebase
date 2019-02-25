/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import AngleRightIcon from 'react-icons/lib/fa/angle-right';
import AngleLeftIcon from 'react-icons/lib/fa/angle-left';

export function NextIcon(props, {i18n}) {
  let Icon = i18n.dir === 'rtl' ? AngleLeftIcon : AngleRightIcon;
  return <Icon {...props} />;
}
NextIcon.contextTypes = ReactUI.I18N.contextTypes;

export function PrevIcon(props, {i18n}) {
  let Icon = i18n.dir === 'rtl' ? AngleRightIcon : AngleLeftIcon;
  return <Icon {...props} />;
}
PrevIcon.contextTypes = ReactUI.I18N.contextTypes;

