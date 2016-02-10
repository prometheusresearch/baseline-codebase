/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {override} from 'rex-widget/stylesheet';

import DropActionInfo from './DropActionInfo';
import DetailedActionInfo from './DetailedActionInfo';

let stylesheet = override(DetailedActionInfo.stylesheet, {
  HeaderInfo: DropActionInfo
});

export default function DropDetailedActionInfo(props) {
  return <DetailedActionInfo {...props} stylesheet={stylesheet} />;
}

