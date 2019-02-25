/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import RadioBase from './RadioBase';

storiesOf('<RadioBase />', module)
  .add('Off state', () => <RadioBase value={false} />)
  .add('On state', () => <RadioBase value={true} />);
