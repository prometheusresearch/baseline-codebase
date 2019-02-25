/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import ButtonBase from './ButtonBase';

storiesOf('<ButtonBase />', module).add('Default state', () => (
  <ButtonBase>Click me</ButtonBase>
));
