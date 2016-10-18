/**
 * @flow
 */

import React from 'react'
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';
import {HBox} from '@prometheusresearch/react-box';
import color from 'color';
import * as theme from './Theme';

function createButton({displayName, theme}) {
  let Root = style(HBox, {
    displayName: `${displayName}Root`,
    base: {
      color: theme.color,

      justifyContent: 'center',
      userSelect: 'none',
      cursor: 'default',
      fontSize: '10px',
      alignItems: 'center',

      hover: {
        color: color(theme.color).darken(0.1).rgbString(),
        backgroundColor: css.rgba(255, 255, 255, 0.15),
      },
    },

    enableActive: {
      active: {
        color: theme.background,
        backgroundColor: theme.color,
      },
    }

  });

  return class extends React.Component {
    static displayName = displayName;
    render() {
      let {children, icon, disableActive, ...props} = this.props;
      let variant = {enableActive: !disableActive};
      return (
        <Root {...props} variant={variant} paddingH={7} paddingV={5}>
          {icon && <HBox paddingRight={5}>{icon}</HBox>}
          {children}
        </Root>
      );
    }
  }
}

export let NavigateButton = createButton({
  displayName: 'NavigateButton',
  theme: theme.entity
});

export let AggregateButton = createButton({
  displayName: 'AggregateButton',
  theme: theme.aggregate
});

export let DefineButton = createButton({
  displayName: 'AggregateButton',
  theme: theme.traverse
});

export let FilterButton = createButton({
  displayName: 'FilterButton',
  theme: theme.filter
});

export let SelectButton = createButton({
  displayName: 'SelectButton',
  theme: theme.select
});
