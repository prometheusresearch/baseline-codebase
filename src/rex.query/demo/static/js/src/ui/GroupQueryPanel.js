/**
 * @flow
 */

import type {QueryPointer} from '../model/QueryPointer';
import type {Actions} from '../state';

import React from 'react';

import * as q from '../model/Query';
import * as t from '../model/Type';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import {MenuButton, MenuGroup} from './menu';

type GroupQueryPanelProps = {
  pointer: QueryPointer<q.GroupQuery>;
  onClose: () => *;
};

export default class GroupQueryPanel
  extends React.Component<*, GroupQueryPanelProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  onSelect = (path: string) => {
    let byPath = this.props.pointer.query.byPath.concat(path);
    this.context.actions.setGroupByPath({
      pointer: this.props.pointer,
      byPath,
    });
  };

  onSelectRemove = (path: string) => {
    let byPath = this.props.pointer.query.byPath.filter(p => p !== path);
    this.context.actions.setGroupByPath({
      pointer: this.props.pointer,
      byPath,
    });
  };

  render() {
    const {pointer, onClose, ...rest} = this.props;
    const {query} = pointer;

    return (
      <QueryPanelBase
        {...rest}
        title="Group"
        onClose={onClose}
        theme={theme.group}
        pointer={pointer}>
        <GroupMenu
          query={query}
          onSelect={this.onSelect}
          onSelectRemove={this.onSelectRemove}
          />
      </QueryPanelBase>
    );
  }
}

function GroupMenu({
  query: {byPath, context: {domain, prev: {type}}},
  onSelect,
  onSelectRemove,
}) {
  let items = [];
  type = t.maybeAtom(type);
  if (type != null && type.name === 'record') {
    let attribute = t.recordAttribute(type);
    for (let name in attribute) {
      if (!attribute.hasOwnProperty(name)) {
        continue;
      }
      let type = attribute[name].type;
      if (type == null) {
        continue;
      }
      if (type.name === 'seq') {
        continue;
      }
      type = t.atom(type);
      if (type.name === 'record') {
        continue;
      }
      items.push(
        <GroupButton
          key={name}
          selected={byPath.indexOf(name) > -1}
          name={name}
          onSelect={onSelect}
          onSelectRemove={onSelectRemove}
          />
      );
    }

    // TODO: fill items from scope, right?
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
      this.props.onSelectRemove(this.props.name);
    } else {
      this.props.onSelect(this.props.name);
    }
  };

  render() {
    let {name, selected} = this.props;
    return (
      <MenuButton
        onClick={this.onClick}
        icon={selected ? '✓' : null}
        selected={selected}>
        {name}
      </MenuButton>
    );
  }
}
