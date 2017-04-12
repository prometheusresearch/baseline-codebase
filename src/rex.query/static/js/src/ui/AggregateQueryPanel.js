/**
 * @flow
 */

import type {Actions} from '../state';
import type {AggregateQuery} from '../model/types';

import map from 'lodash/map';

import React from 'react';
import {VBox, Element} from 'react-stylesheet';

import * as q from '../model/Query';
import * as t from '../model/Type';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import Select from './Select';
import {MenuButton, MenuGroup, MenuHelp} from './menu';

type AggregateQueryPanelProps = {
  query: AggregateQuery,
  onClose: () => *,
};

const ENTITY_SENTINEL = '__entity_sentinel__';

export default class AggregateQueryPanel
  extends React.Component<*, AggregateQueryPanelProps, *> {
  context: {
    actions: Actions,
  };

  static contextTypes = {actions: React.PropTypes.object};

  onSelect = (aggregate: string) => {
    this.context.actions.setAggregate({
      at: this.props.query,
      aggregate,
      path: this.props.query.path,
    });
  };

  onAttribute = (path: string) => {
    this.context.actions.setAggregate({
      at: this.props.query,
      aggregate: 'count',
      path: path === ENTITY_SENTINEL ? null : path,
    });
  };

  render() {
    const {query, onClose, ...rest} = this.props;
    const prevType = query.context.prev.type;

    let attributeSelect = null;

    if (prevType.name === 'record') {
      let options = [
        {
          label: <Element textTransform="capitalize">{query.context.prev.title}</Element>,
          value: ENTITY_SENTINEL,
        },
      ];

      options = options.concat(
        map(t.recordAttribute(prevType), (f, k) => ({
          label: <Element textTransform="capitalize">{f.title || k}</Element>,
          value: k,
        })),
      );

      // TODO: allow to summarize by query in scope

      attributeSelect = (
        <MenuGroup title="Select attribute to summarize by" overflow="visible">
          <VBox padding={10} overflow="visible">
            <Select
              clearable={false}
              value={query.path || ENTITY_SENTINEL}
              options={options}
              onChange={this.onAttribute}
              placeholder="Relationship"
            />
          </VBox>
        </MenuGroup>
      );
    }

    return (
      <QueryPanelBase
        {...rest}
        title={query.context.title}
        onClose={onClose}
        theme={theme.aggregate}
        query={query}>
        {attributeSelect}
        <AggregateMenu
          title="Select summarize function"
          query={query}
          onSelect={this.onSelect}
        />
        <MenuHelp>
          Edit current query combinator by selecting another summarize function
          to apply to the current pipeline.
        </MenuHelp>
      </QueryPanelBase>
    );
  }
}

function AggregateMenu(
  {
    query: {aggregate, path, context},
    title,
    onSelect,
  },
) {
  let type = path == null
    ? context.prev.type
    : q.inferQueryType(context.prev, q.navigate(path)).context.type;
  let items = [];
  for (let name in context.domain.aggregate) {
    if (!context.domain.aggregate.hasOwnProperty(name)) {
      continue;
    }
    if (type.name === 'invalid') {
      continue;
    }
    if (!context.domain.aggregate[name].isAllowed(type)) {
      continue;
    }
    items.push(
      <AggregateButton
        key={name}
        selected={aggregate}
        aggregate={context.domain.aggregate[name]}
        name={name}
        onClick={onSelect}
      />,
    );
  }
  return (
    <MenuGroup title={title}>
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
