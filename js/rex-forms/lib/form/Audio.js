/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';

import AudioPlayer from './AudioPlayer';

export default function Audio({source, disabled}) {
  return (
    <ReactUI.Block paddingH="medium" marginBottom="medium">
      <AudioPlayer source={source} disabled={disabled} showDuration />
    </ReactUI.Block>
  );
}
