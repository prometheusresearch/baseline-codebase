/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import ErrorText from './ErrorText';

storiesOf('<ErrorText />', module).add('Regular', () => (
  <ErrorText>Error happened</ErrorText>
));
