/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import Select from './Select';

storiesOf('<Select />', module).add('Basic', () => (
  <Select options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]} />
));
