/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import Field from './Field';
import Input from './Input';

storiesOf('<Field />', module)
  .add('Simple', () => <Field label="Label" input={<Input />} />)
  .add('Hint', () => <Field label="Label" hint="Hint" input={<Input />} />)
  .add('Invalid', () => <Field invalid label="Label" hint="Hint" input={<Input />} />)
  .add('Error text', () => <Field error="Error" label="Label" input={<Input />} />)
  .add('Error text inline', () => (
    <Field errorInline="Error" label="Label" input={<Input />} />
  ))
  .add('Disabled', () => <Field disabled label="Label" input={<Input disabled />} />);
