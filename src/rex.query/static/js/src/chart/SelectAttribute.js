/**
 * @flow
 */

import {type Context, type QueryNavigation} from '../model/types';

import React from 'react';

import {getNavigation} from '../model';
import * as ui from '../ui';
import ChartControl from './ChartControl';

type SelectAttributeProps = {
  context: Context,
  label: string,
  value: ?string,
  noResultsText?: string | React$Element<*>,
  onChange: (string) => *,
  onlyNumerics?: boolean,
  addSumarizations?: boolean,
};

function isNumericNav(nav: QueryNavigation): boolean {
  return (nav.card == null || nav.card === 'opt') && nav.context.type.name === 'number';
}

function getSelectOptionsFromContext(
  context: Context,
  params: {
    onlyNumerics?: boolean,
    addSumarizations?: boolean,
  },
): Array<ui.SelectOption> {
  const {onlyNumerics, addSumarizations} = params;
  const navigation = Array.from(getNavigation(context).values());
  const options = [];

  for (let i = 0; i < navigation.length; i++) {
    const nav = navigation[i];

    if (addSumarizations && nav.card === 'seq') {
      options.push({
        label: '# ' + nav.label,
        value: nav.value,
      });
    }

    if (onlyNumerics && !isNumericNav(nav)) {
      continue;
    }

    options.push({
      label: nav.label,
      value: nav.value,
    });
  }

  return options;
}

export default function SelectAttribute(
  {
    context,
    label,
    value,
    onChange,
    noResultsText,
    onlyNumerics,
    addSumarizations,
  }: SelectAttributeProps,
) {
  const options = getSelectOptionsFromContext(context, {onlyNumerics, addSumarizations});
  return (
    <ChartControl
      label={label}
      control={
        <ui.Select
          noResultsText={noResultsText}
          wrapperStyle={{width: 300}}
          value={value}
          options={options}
          onChange={onChange}
        />
      }
    />
  );
}
