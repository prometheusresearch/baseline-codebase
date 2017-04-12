/**
 * @flow
 */

import React from 'react';
import {style, css, HBox} from 'react-stylesheet';
import * as theme from './Theme';
import * as Pane from './QueryPane';

function createButton({displayName, theme}) {
  let Root = style(HBox, {
    displayName: `${displayName}Root`,
    base: {
      color: theme.textColor,

      borderRadius: 2,
      justifyContent: 'center',
      userSelect: 'none',
      cursor: 'default',
      fontSize: '10px',
      alignItems: 'center',

      hover: {
        color: theme.textColorActive,
        backgroundColor: theme.backgroundColorOnHover || css.rgba(255, 255, 255, 0.15),
      },
    },

    active: {
      color: theme.backgroundColor,
      backgroundColor: theme.backgroundColorOnActive || theme.textColor,
      hover: {
        color: theme.backgroundColor,
        backgroundColor: theme.backgroundColorOnActive || theme.textColor,
      },
    },

    enableActive: {
      active: {
        color: theme.backgroundColor,
        backgroundColor: theme.backgroundColorOnActive || theme.textColor,
      },
    },
  });

  return class extends React.Component {
    static displayName = displayName;
    render() {
      let {children, icon, disableActive, active, ...props} = this.props;
      let variant = {active, enableActive: !disableActive};
      return (
        <Root padding={{horizontal: 7, vertical: 5}} {...props} variant={variant}>
          {icon && <HBox paddingRight={5}>{icon}</HBox>}
          {children}
        </Root>
      );
    }
  };
}

type RaisedButtonProps = {
  selected: boolean,
};

function createRaisedButton({displayName, Button, Pane}) {
  return (props: RaisedButtonProps) => {
    const {selected, ...rest} = props;
    return (
      <Pane variant={{selected}}>
        <Button padding={{horizontal: 10, vertical: 5}} {...rest} />
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
  theme: theme.entity,
});

export let AggregateButton = createButton({
  displayName: 'AggregateButton',
  theme: theme.aggregate,
});

export let GroupButton = createButton({
  displayName: 'GroupButton',
  theme: theme.group,
});

export let DefineButton = createButton({
  displayName: 'AggregateButton',
  theme: theme.traverse,
});

export let FilterButton = createButton({
  displayName: 'FilterButton',
  theme: theme.filter,
});

export let SelectButton = createButton({
  displayName: 'SelectButton',
  theme: theme.select,
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
