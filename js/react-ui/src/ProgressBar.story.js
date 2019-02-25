/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import ProgressBar from './ProgressBar';

storiesOf('<ProgressBar />', module)
  .add('0%', () => <ProgressBar />)
  .add('33%', () => <ProgressBar progress={0.33} />)
  .add('66%', () => <ProgressBar progress={0.66} />)
  .add('100%', () => <ProgressBar progress={1} />);
