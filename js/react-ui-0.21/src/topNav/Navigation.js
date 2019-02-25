/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';

import {css, style} from '../stylesheet';
import theme from './theme';
import Title from './Title';

let TopNavigationContainer = style(VBox, {
  flexDirection: 'column-reverse',
});

let Top = style(HBox, {
  boxShadow: theme.header.boxShadow,
  background: theme.header.background,
  color: theme.header.text,
  border: css.none,
  height: theme.header.height,
  justifyContent: 'center',
});

let PrimaryMenuContainer = style(HBox, {
  alignItems: 'flex-end',
  flex: 1,
});

let SecondaryMenuContainer = style(HBox, {
  boxShadow: theme.subHeader.boxShadow,
  background: theme.subHeader.background,
  color: theme.subHeader.text,
  border: css.display.block,
  height: theme.subHeader.height,
  paddingLeft: 208,
  width: '100%',
  collapsed: {
    height: 5
  },
});

let ApplicationTitleContainer = style(VBox, {
  justifyContent: 'flex-end',
  padding: '5px 10px',
});

let ApplicationMenuContainer = style(HBox, {
  alignItems: 'flex-start',
  marginRight: 5
});

export default class Navigation extends React.Component {

  render() {
    let {
      title,
      menu,
      secondaryMenu,
      applicationMenu
    } = this.props;

    if (typeof title === 'string') {
      title = <Title>{title}</Title>;
    }

    return (
      <TopNavigationContainer>
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
      </TopNavigationContainer>
    );
  }
}
