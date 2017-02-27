/**
 * @flow
 */

import React from 'react';
import {HBox, Element} from 'react-stylesheet';

type ChartControlProps = {label: string, control: React.Element<*>};

export default function ChartControl({label, control}: ChartControlProps) {
  return (
    <HBox overflow="visible" alignItems="baseline" padding={5}>
      <HBox width={200} justifyContent="flex-end">
        <Element Component="label" padding={10} fontWeight={200} fontSize="10pt">
          {label}
        </Element>
      </HBox>
      <HBox overflow="visible" flexGrow={1}>
        {control}
      </HBox>
    </HBox>
  );
}
