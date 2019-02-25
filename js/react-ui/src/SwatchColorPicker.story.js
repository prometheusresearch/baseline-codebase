/**
 * @flow
 */

import React from 'react';
import {storiesOf, action} from '@kadira/storybook';
import SwatchColorPicker from './SwatchColorPicker';

const colorList = [
  '#B80000',
  '#DB3E00',
  '#FCCB00',
  '#008B02',
  '#006B76',
  '#1273DE',
  '#004DCF',
  '#5300EB',
  '#EB9694',
  '#FAD0C3',
  '#FEF3BD',
  '#C1E1C5',
  '#BEDADC',
  '#C4DEF6',
  '#BED3F3',
  '#D4C4FB',
];

storiesOf('<SwatchColorPicker />', module)
  .add('basic', () => {
    return (
      <SwatchColorPicker
        colorList={colorList}
        value="#b80000"
        onChange={action('onChange')}
      />
    );
  })
  .add('position right', () => {
    return (
      <SwatchColorPicker
        menuPosition="right"
        colorList={colorList}
        value="#b80000"
        onChange={action('onChange')}
      />
    );
  });
