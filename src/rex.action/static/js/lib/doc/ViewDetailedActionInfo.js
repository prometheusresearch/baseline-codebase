/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';

import ViewActionInfo from './ViewActionInfo';
import DetailedActionInfo from './DetailedActionInfo';

let stylesheet = override(DetailedActionInfo.stylesheet, {
  HeaderInfo: ViewActionInfo
});

export default function ViewDetailedActionInfo(props) {
  return <DetailedActionInfo {...props} stylesheet={stylesheet} />;
}

