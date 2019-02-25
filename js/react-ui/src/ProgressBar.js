/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import {style} from 'react-stylesheet';

import Block from './Block';
import {brandColors} from './theme';

let ProgressBarRoot = style(Block, {
  base: {
    width: '100%',
    height: 24,
    background: '#79b8f1',
  },
});

let ProgressBarBar = style(Block, {
  base: {
    background: brandColors.primary,
    height: '100%',
  },
});

let ProgressBarLabel = style(Block, {
  base: {
    color: '#ffffff',
    textAlign: 'center',
    textShadow: `1px 1px 0px ${brandColors.primary}`,
    verticalAlign: 'middle',
    height: '100%',
    width: '100%',
    fontSize: '12px',
    padding: '5px',
  },
});

type Props = {
  progress?: number,
  formatLabel?: ({progress: number}) => string | React$Element<*>,
};

export default function ProgressBar({progress = 0, formatLabel}: Props) {
  let progressWidth = `${100 * progress}%`;
  let progressLabel = formatLabel
    ? formatLabel({progress})
    : `${Math.floor(100 * progress)}%`;
  return (
    <ProgressBarRoot>
      <ProgressBarBar position="absolute" width={progressWidth} />
      <ProgressBarLabel position="absolute">
        {progressLabel}
      </ProgressBarLabel>
    </ProgressBarRoot>
  );
}
