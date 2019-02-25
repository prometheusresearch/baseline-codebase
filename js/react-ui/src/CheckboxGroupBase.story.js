/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import CheckboxGroupBase from './CheckboxGroupBase';

storiesOf('<CheckboxGroupBase />', module).add('Example', () => (
  <CheckboxGroupBase options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]} />
));
