/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';

import Label from './Label';
import AudioPlayer from './AudioPlayer';

export default function OptionLabel({text, audio}) {
  if (!audio) {
    return <Label>{text}</Label>;
  } else {
    return (
      <ReactUI.Block inline maxWidth="100%">
        <ReactUI.Block inline marginRight="x-small">
          <AudioPlayer source={audio} />
        </ReactUI.Block>
        <Label>{text}</Label>
      </ReactUI.Block>
    );
  }
}


