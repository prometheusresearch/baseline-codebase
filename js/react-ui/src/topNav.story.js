/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import * as topNav from './topNav';

storiesOf('<topNav.Navigation />', module)
  .add('Basic', () => (
    <topNav.Navigation
      title="React UI"
      applicationMenu={[
        <topNav.PrimaryButton key="logout" variant={{small: true}}>
          Log out
        </topNav.PrimaryButton>,
      ]}
      menu={[
        <topNav.PrimaryButton key="main">
          Main
        </topNav.PrimaryButton>,
        <topNav.PrimaryMenu
          key="menu"
          items={[
            <topNav.SecondaryButton key="item1">
              Item 1
            </topNav.SecondaryButton>,
            <topNav.SecondaryButton key="item2">
              Item 2
            </topNav.SecondaryButton>,
          ]}>
          Menu
        </topNav.PrimaryMenu>,
      ]}
    />
  ))
  .add('With secondary menu', () => (
    <topNav.Navigation
      title="React UI"
      applicationMenu={[
        <topNav.PrimaryButton key="logout" variant={{small: true}}>
          Log out
        </topNav.PrimaryButton>,
      ]}
      menu={[
        <topNav.PrimaryButton key="main">
          Main
        </topNav.PrimaryButton>,
        <topNav.PrimaryMenu
          key="menu"
          items={[
            <topNav.SecondaryButton key="item1">
              Item 1
            </topNav.SecondaryButton>,
            <topNav.SecondaryButton key="item2">
              Item 2
            </topNav.SecondaryButton>,
          ]}>
          Menu
        </topNav.PrimaryMenu>,
      ]}
      secondaryMenu={[
        <topNav.SecondaryButton key="main" variant={{open: true}}>
          Main
        </topNav.SecondaryButton>,
        <topNav.SecondaryButton key="another">
          Another
        </topNav.SecondaryButton>,
      ]}
    />
  ));
