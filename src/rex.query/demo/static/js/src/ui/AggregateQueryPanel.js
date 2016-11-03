/**
 * @flow
 */

import type {QueryPointer} from '../model/QueryPointer';
import type {Actions} from '../state';

import React from 'react';

import * as q from '../model/Query';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import {MenuButton, MenuGroup} from './menu';

type AggregateQueryPanelProps = {
  pointer: QueryPointer<q.AggregateQuery>;
  onClose: () => *;
};

export default class AggregateQueryPanel
  extends React.Component<*, AggregateQueryPanelProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  onSelect = (aggregate: string) => {
    this.context.actions.replace({
      pointer: this.props.pointer,
      query: q.aggregate(aggregate),
    });
  };

  render() {
    const {pointer, onClose, ...rest} = this.props;
    const {query} = pointer;

    return (
      <QueryPanelBase
        {...rest}
        title={query.context.domain.aggregate[query.aggregate].title}
        onClose={onClose}
        theme={theme.aggregate}
        pointer={pointer}>
        <AggregateMenu
          query={query}
          onSelect={this.onSelect}
          />
      </QueryPanelBase>
    );
  }
}

function AggregateMenu({
  query: {aggregate, context: {domain, prev: {type}}},
  onSelect,
}) {
  let items = [];
  for (let name in domain.aggregate) {
    if (!domain.aggregate.hasOwnProperty(name)) {
      continue;
    }
    if (type == null) {
      continue;
    }
    if (!domain.aggregate[name].isAllowed(type)) {
      continue;
    }
    items.push(
      <AggregateButton
        key={name}
        selected={aggregate}
        aggregate={domain.aggregate[name]}
        name={name}
        onClick={onSelect}
        />
    );
  }
  return (
    <MenuGroup>
      {items}
    </MenuGroup>
  );
}

class AggregateButton extends React.Component {

  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    this.props.onClick(this.props.name);
  };

  render() {
    let {name, aggregate, selected} = this.props;
    let isSelected = name === selected;
    return (
      <MenuButton
        onClick={this.onClick}
        icon={isSelected ? '✓' : null}
        selected={isSelected}>
        {aggregate.title}
      </MenuButton>
    );
  }
}
