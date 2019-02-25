/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import Block from './Block';
import {brandColors} from './theme';
import {style} from './stylesheet';

let ProgressBarRoot = style(Block, {
  width: '100%',
  height: 24,
  background: '#79b8f1',
});

let ProgressBarBar = style(Block, {
  background: brandColors.primary,
  height: '100%',
});

let ProgressBarLabel = style(Block, {
  color: '#ffffff',
  textAlign: 'center',
  textShadow: `1px 1px 0px ${brandColors.primary}`,
  verticalAlign: 'middle',
  height: '100%',
  width: '100%',
  fontSize: '12px',
  padding: '5px',
});

export default function ProgressBar({progress, formatLabel}) {
  let progressWidth = `${100 * progress}%`;
  let progressLabel = formatLabel ?
    formatLabel({progress}) :
    `${Math.floor(100 * progress)}%`;
  return (
    <ProgressBarRoot>
      <ProgressBarBar
        position="absolute"
        width={progressWidth}
        />
      <ProgressBarLabel
        position="absolute">
        {progressLabel}
      </ProgressBarLabel>
    </ProgressBarRoot>
  );
}
