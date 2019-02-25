/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import RadioGroup from './RadioGroup';
import I18N from './I18N';

storiesOf('<RadioGroup />', module)
  .add('Vertical layout', () => (
    <RadioGroup options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]} />
  ))
  .add('Horizontal layout', () => (
    <RadioGroup
      layout="horizontal"
      options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]}
    />
  ))
  .add('Horizontal layout (rtl)', () => (
    <I18N dir="rtl">
      <RadioGroup
        layout="horizontal"
        options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]}
      />
    </I18N>
  ));
