/**
 * @flow
 */

import React from 'react';

import {Element, VBox} from 'react-stylesheet';
import * as Theme from './Theme';
import ArrowDown from './ArrowDown';

type ShapeProps = {
  children?: React$Element<*>,
  first?: boolean,
  variant: {selected?: boolean, invalid?: boolean},
};

function createPane(
  {
    displayName,
    theme,
    noActiveBorder,
  }: {
    displayName: string,
    theme: Theme.QueryVisTheme,
    noActiveBorder?: boolean,
  },
) {
  function Shape({children, first, variant, ...props}: ShapeProps) {
    let selected = variant && variant.selected;
    let invalid = variant && variant.invalid;
    return (
      <VBox
        {...props}
        overflow="visible"
        left={1}
        style={{zIndex: selected ? 1 : 0}}
        paddingBottom={5}>
        <Element
          color={theme.textColor}
          background={theme.backgroundColor}
          border={{
            width: !invalid ? 1 : 2,
            style: 'solid',
            color: !invalid ? theme.borderColor : Theme.invalid.borderColor,
          }}>
          {children}
        </Element>
        <ArrowDown left={5} bottom={0} color={theme.borderColor} />
        <ArrowDown left={5} bottom={1} color={theme.backgroundColor} />
        {!first && [
          <ArrowDown key="1" left={5} top={0} color={theme.borderColor} />,
          <ArrowDown key="2" left={5} top={-1} color="white" />,
        ]}
      </VBox>
    );
  }

  Shape.displayName = displayName;

  return Shape;
}

export let NavigatePane = createPane({
  displayName: 'NavigatePane',
  theme: Theme.entity,
});

export let AggregatePane = createPane({
  displayName: 'AggregatePane',
  theme: Theme.aggregate,
});

export let GroupPane = createPane({
  displayName: 'GroupPane',
  theme: Theme.group,
});

export let DefinePane = createPane({
  displayName: 'DefinePane',
  theme: Theme.traverse,
});

export let FilterPane = createPane({
  displayName: 'FilterPane',
  theme: Theme.filter,
});

export let SelectPane = createPane({
  displayName: 'SelectPane',
  theme: Theme.select,
});

export let DefaultPane = createPane({
  displayName: 'SelectPane',
  theme: Theme.placeholder,
  noActiveBorder: true,
  dashed: true,
});

export let PlainPane = createPane({
  displayName: 'PlainPane',
  theme: Theme.placeholder,
});
