/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import {css, style, VBox, HBox} from 'react-stylesheet';

import theme from './theme';
import Title from './Title';

let Top = style(HBox, {
  base: {
    overflow: 'visible',
    boxShadow: theme.header.boxShadow,
    background: theme.header.background,
    color: theme.header.text,
    border: css.none,
    height: theme.header.height,
    justifyContent: 'center',
  },
});

let PrimaryMenuContainer = style(HBox, {
  base: {
    alignItems: 'flex-end',
    overflow: 'visible',
    flex: '1',
  },
});

let SecondaryMenuContainer = style(HBox, {
  base: {
    boxShadow: theme.subHeader.boxShadow,
    background: theme.subHeader.background,
    color: theme.subHeader.text,
    border: css.display.block,
    height: theme.subHeader.height,
    paddingLeft: 208,
    width: '100%',
  },
  collapsed: {
    height: 5,
  },
});

let ApplicationTitleContainer = style(VBox, {
  base: {
    justifyContent: 'flex-end',
    padding: '5px 10px',
  },
});

let ApplicationMenuContainer = style(HBox, {
  base: {
    alignItems: 'flex-start',
    marginRight: 5,
  },
});

export default class Navigation extends React.Component {
  props: {
    title: ?string | React.Element<*>,
    menu: Array<React.Element<*>>,
    secondaryMenu: Array<React.Element<*>>,
    applicationMenu: Array<React.Element<*>>,
  };

  render() {
    let {
      title,
      menu,
      secondaryMenu,
      applicationMenu,
    } = this.props;

    if (typeof title === 'string') {
      title = <Title>{title}</Title>;
    }

    return (
      <VBox flexDirection="column-reverse" overflow="visible">
        {secondaryMenu &&
          <SecondaryMenuContainer variant={{collapsed: secondaryMenu.length === 0}}>
            {secondaryMenu}
          </SecondaryMenuContainer>}
        <Top>
          <ApplicationTitleContainer>
            {title}
          </ApplicationTitleContainer>
          <PrimaryMenuContainer>
            {menu}
          </PrimaryMenuContainer>
          <ApplicationMenuContainer>
            {applicationMenu}
          </ApplicationMenuContainer>
        </Top>
      </VBox>
    );
  }
}
