/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import CheckboxGroup from './CheckboxGroup';
import I18N from './I18N';

storiesOf('<CheckboxGroup />', module)
  .add('Vertical layout', () => (
    <CheckboxGroup options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]} />
  ))
  .add('Horizontal layout', () => (
    <CheckboxGroup
      layout="horizontal"
      options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]}
    />
  ))
  .add('Horizontal layout (rtl)', () => (
    <I18N dir="rtl">
      <CheckboxGroup
        layout="horizontal"
        options={[{label: 'A', value: 'a'}, {label: 'B', value: 'b'}]}
      />
    </I18N>
  ));
