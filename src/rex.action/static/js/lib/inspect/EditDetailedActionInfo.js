/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';

import EditActionInfo from './EditActionInfo';
import DetailedActionInfo from './DetailedActionInfo';

let stylesheet = override(DetailedActionInfo.stylesheet, {
  HeaderInfo: EditActionInfo
});

export default function EditDetailedActionInfo(props) {
  return <DetailedActionInfo {...props} stylesheet={stylesheet} />;
}

