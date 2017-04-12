/**
 * @flow
 */

import type {Actions} from '../state';
import type {GroupQuery} from '../model/types';

import React from 'react';

import * as t from '../model/Type';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import {MenuButton, MenuGroup} from './menu';

type GroupQueryPanelProps = {
  query: GroupQuery,
  onClose: () => *,
};

export default class GroupQueryPanel extends React.Component<*, GroupQueryPanelProps, *> {
  context: {
    actions: Actions,
  };

  static contextTypes = {actions: React.PropTypes.object};

  onSelect = (path: string) => {
    let byPath = this.props.query.byPath.concat(path);
    this.context.actions.setGroupByPath({
      at: this.props.query,
      byPath,
    });
  };

  onSelectRemove = (path: string) => {
    let byPath = this.props.query.byPath.filter(p => p !== path);
    this.context.actions.setGroupByPath({
      at: this.props.query,
      byPath,
    });
  };

  render() {
    const {query, onClose, ...rest} = this.props;

    return (
      <QueryPanelBase
        {...rest}
        title="Group"
        onClose={onClose}
        theme={theme.group}
        query={query}>
        <GroupMenu
          query={query}
          onSelect={this.onSelect}
          onSelectRemove={this.onSelectRemove}
        />
      </QueryPanelBase>
    );
  }
}

function canGroupBy(type) {
  return !(type.name === 'invalid' || type.name === 'record' || type.card === 'seq');
}

function GroupMenu(
  {
    query: {byPath, context: {domain, scope, prev: {type, scope: prevScope}}},
    onSelect,
    onSelectRemove,
  },
) {
  let items = [];
  if (byPath.length > 0) {
    scope = prevScope;
  }
  if (type.name === 'record') {
    let attribute = t.recordAttribute(type);
    for (let name in attribute) {
      if (!attribute.hasOwnProperty(name)) {
        continue;
      }
      let type = attribute[name].type;
      if (!canGroupBy(type)) {
        continue;
      }
      items.push(
        <GroupButton
          key={name}
          selected={byPath.indexOf(name) > -1}
          name={attribute[name].title}
          path={name}
          onSelect={onSelect}
          onSelectRemove={onSelectRemove}
        />,
      );
    }

    for (let name in scope) {
      if (!scope.hasOwnProperty(name)) {
        continue;
      }
      let type = scope[name].query.context.type;
      if (!canGroupBy(type)) {
        continue;
      }
      items.push(
        <GroupButton
          key={name}
          selected={byPath.indexOf(name) > -1}
          name={scope[name].query.context.title || name}
          path={name}
          onSelect={onSelect}
          onSelectRemove={onSelectRemove}
        />,
      );
    }
  }
  return (
    <MenuGroup>
      {items}
    </MenuGroup>
  );
}

class GroupButton extends React.Component {
  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    if (this.props.selected) {
      this.props.onSelectRemove(this.props.path);
    } else {
      this.props.onSelect(this.props.path);
    }
  };

  render() {
    let {name, selected} = this.props;
    return (
      <MenuButton onClick={this.onClick} icon={selected ? '✓' : null} selected={selected}>
        {name}
      </MenuButton>
    );
  }
}
