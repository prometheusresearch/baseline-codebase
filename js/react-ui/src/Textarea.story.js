/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import Textarea from './Textarea';

storiesOf('<Textarea />', module)
  .add('Default state', () => <Textarea />)
  .add('Error state', () => <Textarea error />)
  .add('Disabled state', () => <Textarea disabled />)
  .add('No border variant', () => <Textarea noBorder />);
