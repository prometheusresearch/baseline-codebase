/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import Checkbox from './Checkbox';
import I18N from './I18N';

storiesOf('<Checkbox/>', module)
  .add('Off state', () => <Checkbox value={false} />)
  .add('On state', () => <Checkbox value={true} />)
  .add('With label', () => <Checkbox value={true} label="Lights on" />)
  .add('With label & hint', () => (
    <Checkbox value={true} label="Lights on" hint="You can control the lights" />
  ))
  .add('With label & hint (rtl)', () => (
    <I18N dir="rtl">
      <Checkbox value={true} label="Lights on" hint="You can control the lights" />
    </I18N>
  ))
  .add('Disabled state', () => (
    <Checkbox disabled value={true} label="Lights on" hint="You can control the lights" />
  ));
