/**
 * @flow
 */

import type {NavigateQuery, QueryNavigation} from '../model/types';
import type {Actions} from '../state';
import type {SearchCallback} from './Search';

import React from 'react';
import {VBox} from 'react-stylesheet';
import {MenuButton, MenuGroup, MenuHelp} from './menu';
import QueryPanelBase from './QueryPanelBase';
import * as theme from './Theme';
import NavigationMenu from './NavigationMenu';

type NavigateQueryPanelProps = {
  query: NavigateQuery,
  onClose: Function,
  onSearch: SearchCallback,
};

export default class NavigateQueryPanel
  extends React.Component<*, NavigateQueryPanelProps, *> {
  context: {
    actions: Actions,
  };

  static contextTypes = {actions: React.PropTypes.object};

  onClick = (path: string) => {
    this.context.actions.setNavigate({
      at: this.props.query,
      path,
    });
  };

  render() {
    let {query, onClose, onSearch, ...rest} = this.props;
    return (
      <QueryPanelBase
        {...rest}
        onClose={onClose}
        title={query.path}
        theme={theme.entity}
        query={query}>
        <NavigationMenu onSearch={onSearch} context={query.context.prev}>
          <this.NavigationMenuContents {...this.props} />
        </NavigationMenu>
      </QueryPanelBase>
    );
  }

  NavigationMenuContents = (
    props: NavigateQueryPanelProps & {navigation: Map<string, QueryNavigation>},
  ) => {
    let {navigation, query} = props;
    return (
      <VBox>
        <MenuGroup>
          {Array.from(navigation.values()).map(nav => {
            let isSelected = nav.value === query.path;
            return (
              <MenuButton
                key={nav.value}
                onClick={this.onClick.bind(null, nav.value)}
                icon={isSelected ? '✓' : null}
                selected={isSelected}>
                {nav.label}
              </MenuButton>
            );
          })}
        </MenuGroup>
        <MenuHelp>
          Edit current query combinator by selecting another relationship to
          navigate to.
        </MenuHelp>
      </VBox>
    );
  };
}
