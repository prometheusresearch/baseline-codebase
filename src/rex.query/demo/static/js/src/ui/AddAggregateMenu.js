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
    navigate: ?q.NavigateQuery;
    aggregate: q.DomainAggregate;
  }) => {
    this.context.actions.appendNavigateAndAggregate({
      pointer: this.props.pointer,
      navigate: payload.navigate,
      aggregate: payload.aggregate,
    });
  };

  render() {
    let {
      pointer: {query: {context: {domain, type}}},
    } = this.props;
    let {searchTerm} = this.state;

    if (type == null) {
      return <NoAggregateMenu />;
    }

    let baseType = t.atom(type);

    if (!(baseType.name === 'record' || baseType.name === 'entity')) {
      return <NoAggregateMenu />;
    }

    let columns = [];
    if (baseType.name === 'record') {
      for (let key in baseType.fields) {
        // $FlowIssue: does not refine to !== null
        if (!baseType.fields.hasOwnProperty(key)) {
          continue;
        }
        // $FlowIssue: does not refine to !== null
        let keyType = baseType.fields[key];
        if (keyType == null) {
          continue;
        }
        columns.push({
          navigate: q.navigate(key),
          type: t.leastUpperBound(type, keyType),
        });
      }
    }

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
          navigate={null}
          aggregate={aggregate}
          name={name}
          onClick={this.onSelect}
          />
      );
    }

    for (let i = 0; i < columns.length; i++) {
      let {type, navigate}= columns[i];
      for (let name in domain.aggregate) {
        if (!domain.aggregate.hasOwnProperty(name)) {
          continue;
        }
        if (type == null) {
          continue;
        }
        let aggregate = domain.aggregate[name];
        if (!aggregate.isAllowed(type)) {
          continue;
        }
        items.push(
          <AggregateButton
            key={aggregate.name + '__' + navigate.path}
            navigate={navigate}
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
            placeholder="Filter…"
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
    navigate: ?q.NavigateQuery;
    aggregate: q.DomainAggregate;
    onClick: (payload: {navigate: ?q.NavigateQuery; aggregate: q.DomainAggregate}) => *;
  };

  onClick = (ev: UIEvent) => {
    ev.stopPropagation();
    let {onClick, navigate, aggregate} = this.props;
    onClick({navigate, aggregate});
  };

  render() {
    let {navigate, aggregate} = this.props;
    return (
      <MenuButton
        icon="＋"
        onClick={this.onClick}>
        <div>
          {aggregate.title} {navigate ? navigate.path : ''}
        </div>
      </MenuButton>
    );
  }
}
