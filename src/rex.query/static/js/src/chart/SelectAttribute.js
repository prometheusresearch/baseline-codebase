/**
 * @flow
 */

import React from 'react';

import {getNavigation} from '../model/QueryNavigation';
import type {Context} from '../model';
import {type QueryNavigation} from '../model/QueryNavigation';
import * as ui from '../ui';
import ChartControl from './ChartControl';

type SelectAttributeProps = {
  context: Context,
  label: string,
  value: ?string,
  filter?: (QueryNavigation) => boolean,
  noResultsText?: string | React$Element<*>,
  onChange: (string) => *,
};

export default function SelectAttribute(
  {context, label, value, onChange, filter, noResultsText}: SelectAttributeProps,
) {
  let nav = Array.from(getNavigation(context).values());
  if (filter != null) {
    nav = nav.filter(filter);
  }
  const options = nav.map(nav => ({
    label: nav.label,
    value: nav.value,
  }));
  return (
    <ChartControl
      label={label}
      control={
        (
          <ui.Select
            noResultsText={noResultsText}
            wrapperStyle={{width: 300}}
            value={value}
            options={options}
            onChange={onChange}
          />
        )
      }
    />
  );
}
