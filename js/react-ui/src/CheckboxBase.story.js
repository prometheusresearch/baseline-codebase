/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import CheckboxBase from './CheckboxBase';

storiesOf('<CheckboxBase />', module)
  .add('Off state', () => <CheckboxBase value={false} />)
  .add('On state', () => <CheckboxBase value={true} />);
