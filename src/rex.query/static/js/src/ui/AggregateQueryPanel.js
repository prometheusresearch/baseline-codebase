/**
 * @flow
 */

import type {QueryPointer} from '../model/QueryPointer';
import type {Actions} from '../state';
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
  pointer: QueryPointer<q.AggregateQuery>;
  onClose: () => *;
};

const ENTITY_SENTINEL = '__entity_sentinel__';

export default class AggregateQueryPanel
  extends React.Component<*, AggregateQueryPanelProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  onSelect = (aggregate: string) => {
    this.context.actions.replace({
      pointer: this.props.pointer,
      query: q.aggregate(aggregate, this.props.pointer.query.path),
    });
  };

  onAttribute = (path: string) => {
    this.context.actions.replace({
      pointer: this.props.pointer,
      query: q.aggregate(
        'count',
        path === ENTITY_SENTINEL ? null : path
      ),
    });
  }

  render() {
    const {pointer, onClose, ...rest} = this.props;
    const {query} = pointer;
    const prevType = query.context.prev.type;

    let attributeSelect = null;
    let title = query.context.domain.aggregate[query.aggregate].title;

    if (prevType.name === 'record') {
      let entityTitle = prevType.entity || 'Query';
      title = query.path
        ? `${entityTitle} ${query.path} ${title}`
        : `${entityTitle} ${title}`

      let options = map(t.recordAttribute(prevType), (f, k) => ({
        label: <Element textTransform="capitalize">{entityTitle} {f.title  || k}</Element>,
        value: k
      }));

      options.unshift({
        label: <Element textTransform="capitalize">{entityTitle}</Element>,
        value: ENTITY_SENTINEL,
      });

      attributeSelect = (
        <MenuGroup
          title="Select attribute to summarize by"
          overflow="visible">
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
        title={title}
        onClose={onClose}
        theme={theme.aggregate}
        pointer={pointer}>
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

function AggregateMenu({
  query: {aggregate, path, context},
  title,
  onSelect,
}) {
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
        />
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
