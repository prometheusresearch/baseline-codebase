/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import Input from './Input';

storiesOf('<Input />', module)
  .add('Default state', () => <Input />)
  .add('Error state', () => <Input error />)
  .add('Disabled state', () => <Input disabled />)
  .add('No border variant', () => <Input noBorder />);
