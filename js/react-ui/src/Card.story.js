/**
 * @flow
 */

import React from 'react';
import {storiesOf} from '@kadira/storybook';
import Card, {CardItem} from './Card';

storiesOf('<Card />', module)
  .add('Basic', () => (
    <Card>
      Card content
    </Card>
  ))
  .add('Basic with padding', () => (
    <Card padding={10}>
      Card content
    </Card>
  ))
  .add('With header', () => (
    <Card padding={10} header="Header">
      Card content
    </Card>
  ))
  .add('With footer', () => (
    <Card padding={10} footer="Footer">
      Card content
    </Card>
  ))
  .add('With header & footer', () => (
    <Card padding={10} header="Header" footer="Footer">
      Card content
    </Card>
  ))
  .add('Success variant', () => (
    <Card padding={10} variant={{success: true}} header="Header" footer="Footer">
      Card content
    </Card>
  ))
  .add('With card item', () => (
    <Card>
      <CardItem padding={10}>
        Item 1
      </CardItem>
      <CardItem padding={10}>
        Item 2
      </CardItem>
    </Card>
  ));
