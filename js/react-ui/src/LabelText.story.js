/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import LabelText from './LabelText';

storiesOf('<LabelText />', module).add('Regular', () => (
  <LabelText>I'm a label</LabelText>
));
