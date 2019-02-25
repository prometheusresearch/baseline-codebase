/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import Radio from './Radio';
import I18N from './I18N';

storiesOf('<Radio />', module)
  .add('Off state', () => <Radio value={false} />)
  .add('On state', () => <Radio value={true} />)
  .add('With label', () => <Radio value={true} label="Lights on" />)
  .add('With label & hint', () => (
    <Radio value={true} label="Lights on" hint="You can control the lights" />
  ))
  .add('With label & hint (rtl)', () => (
    <I18N dir="rtl">
      <Radio value={true} label="Lights on" hint="You can control the lights" />
    </I18N>
  ))
  .add('Disabled state', () => (
    <Radio disabled value={true} label="Lights on" hint="You can control the lights" />
  ));
