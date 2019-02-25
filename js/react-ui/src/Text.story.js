/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import Text from './Text';

storiesOf('<Text />', module).add('Regular', () => <Text>Hello</Text>);
