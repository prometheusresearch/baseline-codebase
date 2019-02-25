/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import RadioGroupBase from './RadioGroupBase';

storiesOf('<RadioGroupBase />', module).add('Example', () => (
  <RadioGroupBase options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]} />
));
