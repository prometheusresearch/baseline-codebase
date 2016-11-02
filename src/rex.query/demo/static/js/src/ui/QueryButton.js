/**
 * @flow
 */

import React from 'react'
import * as css from 'react-stylesheet/css';
import {style} from 'react-stylesheet';
import {HBox} from '@prometheusresearch/react-box';
import color from 'color';
import * as theme from './Theme';
import * as Pane from './QueryPane';

function createButton({displayName, theme}) {
  let Root = style(HBox, {
    displayName: `${displayName}Root`,
    base: {
      color: theme.textColor,

      justifyContent: 'center',
      userSelect: 'none',
      cursor: 'default',
      fontSize: '10px',
      alignItems: 'center',

      hover: {
        color: theme.textColorActive,
        backgroundColor: css.rgba(255, 255, 255, 0.15),
      },
    },

    enableActive: {
      active: {
        color: theme.backgroundColor,
        backgroundColor: theme.textColor,
      },
    }

  });

  return class extends React.Component {
    static displayName = displayName;
    render() {
      let {children, icon, disableActive, ...props} = this.props;
      let variant = {enableActive: !disableActive};
      return (
        <Root paddingH={7} paddingV={5} {...props} variant={variant}>
          {icon && <HBox paddingRight={5}>{icon}</HBox>}
          {children}
        </Root>
      );
    }
  }
}

type RaisedButtonProps = {
  selected: boolean;
};

function createRaisedButton({displayName, Button, Pane}) {
  return  (props: RaisedButtonProps) => {
    const {selected, ...rest} = props;
    return (
      <Pane variant={{selected}}>
        <Button paddingH={10} {...rest} />
      </Pane>
    );
  };
}

export let DefaultButton = createButton({
  displayName: 'DefaultButton',
  theme: theme.placeholder,
});

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

export let NavigateRaisedButton = createRaisedButton({
  displayName: 'NavigateRaisedButton',
  Pane: Pane.NavigatePane,
  Button: NavigateButton,
});

export let SelectRaisedButton = createRaisedButton({
  displayName: 'SelectRaisedButton',
  Pane: Pane.SelectPane,
  Button: SelectButton,
});

export let FilterRaisedButton = createRaisedButton({
  displayName: 'FilterRaisedButton',
  Pane: Pane.FilterPane,
  Button: FilterButton,
});
