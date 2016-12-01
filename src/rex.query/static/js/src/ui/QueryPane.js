/**
 * @flow
 */

import React from 'react';

import {VBox} from '@prometheusresearch/react-box';
import * as theme from './Theme';

function makePath({first, last, open}) {
  let top = first ? '' : '20,0 15,5 10,0';
  let bottom = '10,32 15,37 20,32';
  let end = open ? '' : '278,0';
  return `278,0 ${top} 0,0 0,32 ${bottom} 278,32 ${end}`;
}

function createPane({displayName, theme, noActiveBorder, strokeDasharray}: {
  displayName: string;
  theme: theme.QueryVisTheme;
  noActiveBorder?: boolean;
  strokeDasharray?: string;
}) {

  function Shape({children, first, last, variant, ...props}) {
    let selected = variant && variant.selected;
    let fill = selected && !noActiveBorder
      ? theme.backgroundColorActive
      : theme.backgroundColor;
    let strokeWidth = selected && !noActiveBorder
      ? 2
      : 1;
    let points = makePath({
      last, first,
      open: selected,
    });

    return (
      <VBox {...props}
        paddingBottom={7}
        left={1}
        style={{zIndex: selected ? 1 : 0}}>
        <div style={{
          zIndex: 100,
          paddingTop: 3,
          color: theme.textColor
        }}>
          {children}
        </div>
        <div style={{position: 'absolute'}}>
          <svg
            style={{padding: 1}}
            viewBox="0 0 278 37"
            width="100%"
            height="40px">
            <polyline
              fill={fill}
              stroke={theme.borderColor}
              strokeDasharray={strokeDasharray}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="miter"
              points={points}
              />
          </svg>
        </div>
      </VBox>
    );
  }

  Shape.displayName = displayName;

  return Shape;
}

export let NavigatePane = createPane({
  displayName: 'NavigatePane',
  theme: theme.entity
});

export let AggregatePane = createPane({
  displayName: 'AggregatePane',
  theme: theme.aggregate
});

export let GroupPane = createPane({
  displayName: 'GroupPane',
  theme: theme.group,
});

export let DefinePane = createPane({
  displayName: 'DefinePane',
  theme: theme.traverse
});

export let FilterPane = createPane({
  displayName: 'FilterPane',
  theme: theme.filter
});

export let SelectPane = createPane({
  displayName: 'SelectPane',
  theme: theme.select
});

export let DefaultPane = createPane({
  displayName: 'SelectPane',
  theme: theme.placeholder,
  noActiveBorder: true,
  strokeDasharray: '2, 2',
});

export let PlainPane = createPane({
  displayName: 'PlainPane',
  theme: theme.placeholder,
});
