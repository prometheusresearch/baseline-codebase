/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';

import PickActionInfo from './PickActionInfo';
import DetailedActionInfo from './DetailedActionInfo';

let stylesheet = override(DetailedActionInfo.stylesheet, {
  HeaderInfo: PickActionInfo
});

export default function PickDetailedActionInfo(props) {
  return <DetailedActionInfo {...props} stylesheet={stylesheet} />;
}
