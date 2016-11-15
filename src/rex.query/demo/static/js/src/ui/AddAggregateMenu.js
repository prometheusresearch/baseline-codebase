/**
 * @flow
 */

import type {QueryPipeline, QueryPointer} from '../model';
import type {Actions} from '../state';

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';
import * as ReactUI from '@prometheusresearch/react-ui';

import * as q from '../model/Query';
import * as t from '../model/Type';
import {MenuHelp, MenuGroup, MenuButton} from './menu';

export default class AddAggregateMenu extends React.Component {

  context: {
    actions: Actions;
  };

  props: {
    pointer: QueryPointer<QueryPipeline>;
  };

  state: {
    searchTerm: ?string;
  } = {
    searchTerm: null,
  };


  static contextTypes = {
    actions: React.PropTypes.object,
  };

  onSearchTerm = (e: UIEvent) => {
    let target: {value: string} = (e.target: any);
    this.setState({searchTerm: target.value === '' ? null : target.value});
  };

  onSelect = (payload: {
    path: Array<string>;
    aggregate: t.DomainAggregate;
  }) => {
    this.context.actions.appendNavigateAndAggregate({
      pointer: this.props.pointer,
      path: payload.path,
      aggregate: payload.aggregate,
    });
  };

  render() {
    let {
      pointer: {query},
    } = this.props;
    let {
      searchTerm
    } = this.state;

    let type = getEffectivePipelineType(query);
    let domain = query.context.domain;

    if (type.name === 'invalid') {
      return <NoAggregateMenu />;
    }

    if (type.name !== 'record') {
      return <NoAggregateMenu />;
    }

    let columns = getColumnListToSummarize(type, true);

    let items = [];
    for (let name in domain.aggregate) {
      if (!domain.aggregate.hasOwnProperty(name)) {
        continue;
      }
      let aggregate = domain.aggregate[name];
      if (!aggregate.isAllowed(type)) {
        continue;
      }
      items.push(
        <AggregateButton
          key={aggregate.name}
          path={[]}
          aggregate={aggregate}
          name={name}
          onClick={this.onSelect}
          />
      );
    }

    for (let i = 0; i < columns.length; i++) {
      let {type, path} = columns[i];
      for (let name in domain.aggregate) {
        if (!domain.aggregate.hasOwnProperty(name)) {
          continue;
        }
        if (type.name === 'invalid') {
          continue;
        }
        let aggregate = domain.aggregate[name];
        if (!aggregate.isAllowed(type)) {
          continue;
        }
        items.push(
          <AggregateButton
            key={aggregate.name + '__' + path.join('.')}
            path={path}
            aggregate={aggregate}
            name={name}
            onClick={this.onSelect}
            />
        );
      }
    }

    let otherItems = [];
    if (searchTerm != null) {
      let searchTermRe = new RegExp(searchTerm, 'ig');
      items = items.filter(item => {
        let matches = (
          searchTermRe.test(item.props.aggregate.title) ||
          searchTermRe.test(item.props.navigate.path)
        );
        if (!matches) {
          otherItems.push(item);
        }
        return matches;
      });
    }

    return (
      <VBox>
        <VBox padding={10}>
          <ReactUI.Input
            placeholder="Search…"
            value={searchTerm === null ? '' : searchTerm}
            onChange={this.onSearchTerm}
            />
        </VBox>
        {searchTerm == null &&
          <MenuGroup>
            {items}
          </MenuGroup>}
        {searchTerm != null &&
          <VBox>
            <MenuGroup paddingBottom={20}>
              {items}
            </MenuGroup>
            <MenuGroup title="Other">
              {otherItems}
            </MenuGroup>
          </VBox>}
      </VBox>
    );
  }
}

function NoAggregateMenu({title = 'Summarize'}) {
  return (
    <MenuGroup title={title}>
      <MenuHelp>
        Currently selected query has no values to summarize.
      </MenuHelp>
    </MenuGroup>
  );
}

class AggregateButton extends React.Component {

  props: {
    path: Array<string>;
    aggregate: t.DomainAggregate;
    onClick: (payload: {
      path: Array<string>;
      aggregate: t.DomainAggregate
    }) => *;
  };

  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    let {onClick, path, aggregate} = this.props;
    onClick({path, aggregate});
  };

  render() {
    let {path, aggregate} = this.props;
    return (
      <MenuButton
        icon="＋"
        onClick={this.onClick}>
        <div>
          {aggregate.title} {path.join(' ')}
        </div>
      </MenuButton>
    );
  }
}

function getColumnListToSummarize(type: t.Type, noRecursion = false) {
  let columns = [];
  if (type.name === 'record') {
    let attribute = t.recordAttribute(type);
    for (let key in attribute) {
      if (!attribute.hasOwnProperty(key)) {
        continue;
      }
      let attr = attribute[key];
      if (attr.type.name === 'invalid') {
        continue;
      }

      let column = {
        path: [key],
        type: t.leastUpperBound(type, attr.type),
      };

      if (column.type.name === 'record') {
        if (!noRecursion) {
          columns = columns.concat(
            getColumnListToSummarize(column.type, true)
            .map(column => ({...column, path: [key].concat(column.path)}))
          );
        }
        if (column.type.card === 'seq') {
          columns.push(column);
        }
      } else {
        columns.push(column);
      }
    }
  }
  return columns;
}

function getEffectivePipelineType(query: q.QueryPipeline): t.Type {
  if (query.pipeline.length === 1) {
    return query.context.type;
  }

  let last = query.pipeline[query.pipeline.length - 1];

  if (last.name === 'select') {
    return query.pipeline[query.pipeline.length - 2].context.type;
  } else {
    return query.context.type;
  }
}
