/**
 * @flow
 */

import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';
import {VBox} from '@prometheusresearch/react-box';
import * as theme from './Theme';

function createPane({displayName, theme, noActiveBorder}: {
  displayName: string;
  theme: theme.QueryVisTheme;
  noActiveBorder?: boolean;
}) {
  let makeBorder = (width) => css.border(
    width,
    theme.borderStyle ? theme.borderStyle : 'solid',
    theme.borderColor
  );
  return style(VBox, {
    displayName,
    base: {
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      boxShadow: css.boxShadow(0, 1, 2, -1, '#aaa'),
      marginBottom: 2,
      marginLeft: 2,
      border: makeBorder(1),
      borderRight: css.none,
    },
    selected: {
      zIndex: 1,
      backgroundColor: theme.backgroundColorActive,
      borderLeft: noActiveBorder ? undefined : makeBorder(4),
    }
  });
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
});
