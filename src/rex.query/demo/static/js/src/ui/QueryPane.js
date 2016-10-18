/**
 * @flow
 */

import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';
import {VBox} from '@prometheusresearch/react-box';
import color from 'color';
import * as theme from './Theme';

function createPane({displayName, theme}) {
  return style(VBox, {
    displayName,
    base: {
      backgroundColor: theme.background,
      color: theme.color,
    },
    selected: {
      zIndex: 1,
      boxShadow: css.boxShadow(0, 1, 2, 0, '#bbb'),
      backgroundColor: color(theme.background).darken(0.2).rgbString(),
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

export let DefinePane = createPane({
  displayName: 'AggregatePane',
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
