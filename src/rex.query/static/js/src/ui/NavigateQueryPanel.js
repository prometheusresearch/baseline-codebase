/**
 * @flow
 */

import type {NavigateQuery, QueryPointer} from '../model';
import type {Actions} from '../state';

import React from 'react';
import * as nav from '../model/navigation';
import * as q from '../model/Query';
import {MenuButton, MenuGroup, MenuHelp} from './menu';
import QueryPanelBase from './QueryPanelBase';
import * as theme from './Theme';

type NavigateQueryPanelProps = {
  pointer: QueryPointer<NavigateQuery>;
  onClose: Function;
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
    let {pointer, onClose, ...rest} = this.props;
    let navigation = nav.getNavigationBefore(pointer.query.context);
    return (
      <QueryPanelBase
        {...rest}
        onClose={onClose}
        title={pointer.query.path}
        theme={theme.entity}
        pointer={pointer}>
        <MenuGroup>
          {navigation.map(nav => {
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
      </QueryPanelBase>
    );
  }
}

