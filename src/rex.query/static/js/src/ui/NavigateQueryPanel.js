/**
 * @flow
 */

import type {NavigateQuery, QueryPointer, QueryNavigation} from '../model';
import type {Actions} from '../state';
import type {SearchCallback} from './Search';

import React from 'react';
import {VBox} from 'react-stylesheet';
import * as q from '../model/Query';
import {MenuButton, MenuGroup, MenuHelp} from './menu';
import QueryPanelBase from './QueryPanelBase';
import * as theme from './Theme';
import NavigationMenu from './NavigationMenu';

type NavigateQueryPanelProps = {
  pointer: QueryPointer<NavigateQuery>;
  onClose: Function;
  onSearch: SearchCallback;
};

export default class NavigateQueryPanel extends React.Component<*, NavigateQueryPanelProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  onClick = (path: string) => {
    this.context.actions.replace({
      pointer: this.props.pointer,
      query: q.navigate(path),
    });
  }

  render() {
    let {pointer, onClose, onSearch, ...rest} = this.props;
    return (
      <QueryPanelBase
        {...rest}
        onClose={onClose}
        title={pointer.query.path}
        theme={theme.entity}
        pointer={pointer}>
        <NavigationMenu onSearch={onSearch} context={pointer.query.context.prev}>
          <this.NavigationMenuContents {...this.props} />
        </NavigationMenu>
      </QueryPanelBase>
    );
  }

  NavigationMenuContents = (
    props: NavigateQueryPanelProps & {navigation: Map<string, QueryNavigation>}
  ) => {
    let {
      navigation,
      pointer,
    } = props;
    return (
      <VBox>
        <MenuGroup>
          {Array.from(navigation.values()).map(nav => {
            let isSelected = nav.value === pointer.query.path;
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
