/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';

import MakeActionInfo from './MakeActionInfo';
import DetailedActionInfo from './DetailedActionInfo';

let stylesheet = override(DetailedActionInfo.stylesheet, {
  HeaderInfo: MakeActionInfo
});

export default function MakeDetailedActionInfo(props) {
  return <DetailedActionInfo {...props} stylesheet={stylesheet} />;
}

